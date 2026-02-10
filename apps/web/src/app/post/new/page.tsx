"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HomeOutlineIcon, PlusIcon } from "@/components/icons";
import { createPost, getPost, updatePost, getCategories, uploadPostImages, extractImageUrls, stripImagePattern, Category, PostCreateRequest, PostUpdateRequest } from "@/lib/postApi";

// 게시글 이미지 최대 업로드 수 (환경변수 또는 기본값 3)
const MAX_POST_IMAGES = Number(process.env.NEXT_PUBLIC_MAX_POST_IMAGES) || 3;

// 이미지 미리보기 타입
interface ImagePreview {
  file: File;
  previewUrl: string;
}

// Suspense boundary로 감싸는 래퍼 (useSearchParams 필요)
export default function NewPostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    }>
      <NewPostContent />
    </Suspense>
  );
}

// 상품 등록/수정 페이지
function NewPostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const isEditMode = !!editId;

  // 폼 상태
  const [postType, setPostType] = useState<"SELL" | "BUY">("SELL");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currencyType, setCurrencyType] = useState<"BELL" | "MILE_TICKET">("BELL");
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImagePreview[]>([]);

  // 컴포넌트 언마운트 시 미리보기 URL 해제 (메모리 누수 방지)
  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  // 카테고리 목록
  const [categories, setCategories] = useState<Category[]>([]);

  // UI 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 로드
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await getCategories();
        setCategories(response.categories);
        // 수정 모드가 아닐 때만 첫 번째 카테고리 기본 선택
        if (!isEditMode && response.categories.length > 0) {
          setCategoryId(response.categories[0].id);
        }
      } catch (err) {
        console.error("카테고리 로드 실패:", err);
      }
    }
    loadCategories();
  }, [isEditMode]);

  // 수정 모드: 기존 게시글 데이터 로드
  useEffect(() => {
    if (!editId) return;
    async function loadPostData() {
      try {
        const postData = await getPost(parseInt(editId!, 10));
        setPostType(postData.postType);
        setCategoryId(postData.categoryId);
        setItemName(postData.itemName);
        // description에서 이미지 패턴 제거하여 순수 텍스트만 표시
        setDescription(stripImagePattern(postData.description));
        if (postData.price != null) setPrice(String(postData.price));
        if (postData.currencyType) setCurrencyType(postData.currencyType);
        if (postData.priceNegotiable != null) setPriceNegotiable(postData.priceNegotiable);
        // 기존 이미지 URL은 수정 시 유지 (새 이미지 업로드로 교체 가능)
        const existingImageUrls = extractImageUrls(postData.description);
        if (existingImageUrls.length > 0) {
          setExistingImageUrls(existingImageUrls);
        }
      } catch (err) {
        console.error("게시글 로드 실패:", err);
        setError("게시글을 불러오는데 실패했습니다");
      }
    }
    loadPostData();
  }, [editId]);

  // 이미지 파일 선택 핸들러
  const handleImageAdd = () => {
    if ((existingImageUrls.length + images.length) >= MAX_POST_IMAGES) return;
    fileInputRef.current?.click();
  };

  // 파일 선택 후 미리보기 생성
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImagePreview[] = [];
    const remainingSlots = MAX_POST_IMAGES - existingImageUrls.length - images.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        newImages.push({
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    }

    setImages((prev) => [...prev, ...newImages]);

    // input 초기화 (같은 파일 재선택 가능하게)
    e.target.value = "";
  };

  const handleImageRemove = (index: number) => {
    // 미리보기 URL 해제
    URL.revokeObjectURL(images[index].previewUrl);
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!itemName.trim()) {
      setError("제목을 입력해주세요");
      return;
    }
    if (!description.trim()) {
      setError("내용을 입력해주세요");
      return;
    }
    if (!categoryId) {
      setError("카테고리를 선택해주세요");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. 새 이미지가 있으면 업로드
      let newImageUrls: string[] = [];
      if (images.length > 0) {
        const files = images.map((img) => img.file);
        const uploadResult = await uploadPostImages(files);
        newImageUrls = uploadResult.urls;
      }

      // 2. 최종 이미지 URL 목록 (기존 + 새로 업로드)
      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      // 3. 이미지 URL을 설명에 포함
      const descriptionWithImages = allImageUrls.length > 0
        ? `${description.trim()}\n\n[images:${allImageUrls.join(",")}]`
        : description.trim();

      if (isEditMode && editId) {
        // 수정 모드
        const request: PostUpdateRequest = {
          postType,
          categoryId: categoryId ?? undefined,
          itemName: itemName.trim(),
          description: descriptionWithImages,
          currencyType,
          price: price ? parseInt(price, 10) : undefined,
          priceNegotiable,
        };
        await updatePost(parseInt(editId, 10), request);
        router.push(`/post/${editId}`);
      } else {
        // 작성 모드
        const request: PostCreateRequest = {
          postType,
          categoryId,
          itemName: itemName.trim(),
          description: descriptionWithImages,
          currencyType,
          price: price ? parseInt(price, 10) : undefined,
          priceNegotiable,
        };
        const newPost = await createPost(request);
        router.push(`/post/${newPost.id}`);
      }
    } catch (err) {
      console.error(isEditMode ? "게시글 수정 실패:" : "게시글 작성 실패:", err);
      setError(err instanceof Error ? err.message : isEditMode ? "게시글 수정에 실패했습니다" : "게시글 작성에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full min-h-screen bg-white flex flex-col">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <Link href="/" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <HomeOutlineIcon className="w-6 h-6 text-gray-800" />
            </Link>
            <h1 className="font-semibold text-lg">{isEditMode ? "글 수정" : "글쓰기"}</h1>
            <div className="w-8" />
          </div>
        </header>

        {/* 폼 컨텐츠 */}
        <div className="flex-1 p-4 space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 거래 유형 선택 (팔아요/구해요) - 수정 모드에서는 변경 불가 */}
          <div>
            <label className="block text-primary font-semibold mb-2">거래 유형</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => !isEditMode && setPostType("SELL")}
                disabled={isEditMode}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  postType === "SELL"
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                } ${isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                팔아요
              </button>
              <button
                type="button"
                onClick={() => !isEditMode && setPostType("BUY")}
                disabled={isEditMode}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  postType === "BUY"
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                } ${isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                구해요
              </button>
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-primary font-semibold mb-2">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    categoryId === category.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-primary font-semibold mb-2">제목</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              placeholder="상품명을 입력하세요"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-primary font-semibold mb-2">내용</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              placeholder="상품에 대한 설명을 적어주세요"
            />
          </div>

          {/* 화폐 유형 선택 */}
          <div>
            <label className="block text-primary font-semibold mb-2">화폐</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrencyType("BELL")}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  currencyType === "BELL"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                벨
              </button>
              <button
                type="button"
                onClick={() => setCurrencyType("MILE_TICKET")}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  currencyType === "MILE_TICKET"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                마일
              </button>
            </div>
          </div>

          {/* 가격 */}
          <div>
            <label className="block text-primary font-semibold mb-2">가격</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 px-4 py-3 focus:outline-none text-gray-900"
                placeholder="가격을 입력해주세요"
              />
              <span className="px-4 text-primary font-medium">
                {currencyType === "BELL" ? "덩" : "마일"}
              </span>
            </div>
          </div>

          {/* 가격 제안 받기 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPriceNegotiable(!priceNegotiable)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                priceNegotiable
                  ? "bg-primary border-primary"
                  : "border-gray-300"
              }`}
            >
              {priceNegotiable && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-gray-700">가격 제안 받기</span>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-primary font-semibold mb-2">이미지</label>
            {/* 숨겨진 파일 입력 (갤러리/카메라 트리거) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex gap-3 overflow-x-auto pb-2">
              {/* 이미지 추가 버튼 */}
              <button
                type="button"
                onClick={handleImageAdd}
                disabled={(existingImageUrls.length + images.length) >= MAX_POST_IMAGES}
                className="w-16 h-16 flex-shrink-0 border-2 border-primary border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                <PlusIcon className="w-6 h-6 text-primary" />
                <span className="text-xs text-primary mt-0.5">{existingImageUrls.length + images.length}/{MAX_POST_IMAGES}</span>
              </button>

              {/* 기존 이미지 미리보기 (수정 모드) */}
              {existingImageUrls.map((url, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`기존 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setExistingImageUrls(existingImageUrls.filter((_, i) => i !== index))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* 새로 선택된 이미지 미리보기 */}
              {images.map((image, index) => (
                <div
                  key={`new-${index}`}
                  className="relative w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.previewUrl}
                    alt={`이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">최대 {MAX_POST_IMAGES}장까지 등록 가능</p>
          </div>
        </div>

        {/* 작성하기 버튼 */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!itemName.trim() || !description.trim() || !categoryId || isSubmitting}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (isEditMode ? "수정 중..." : "등록 중...") : (isEditMode ? "수정하기" : "작성하기")}
          </button>
        </div>
      </div>
    </div>
  );
}
