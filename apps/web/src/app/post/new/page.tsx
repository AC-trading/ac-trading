"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HomeOutlineIcon, PlusIcon } from "@/components/icons";
import { createPost, getCategories, Category, PostCreateRequest } from "@/lib/postApi";

// 상품 등록 페이지 - Figma 디자인 기반
export default function NewPostPage() {
  const router = useRouter();

  // 폼 상태
  const [postType, setPostType] = useState<"SELL" | "BUY">("SELL");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currencyType, setCurrencyType] = useState<"BELL" | "MILE_TICKET">("BELL");
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [images, setImages] = useState<string[]>([]);

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
        // 첫 번째 카테고리를 기본 선택
        if (response.categories.length > 0) {
          setCategoryId(response.categories[0].id);
        }
      } catch (err) {
        console.error("카테고리 로드 실패:", err);
      }
    }
    loadCategories();
  }, []);

  const handleImageAdd = () => {
    // TODO: 실제 이미지 업로드 로직 (Cloudflare R2)
    // 임시로 더미 이미지 추가
    if (images.length < 10) {
      setImages([...images, `image-${images.length + 1}`]);
    }
  };

  const handleImageRemove = (index: number) => {
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
      const request: PostCreateRequest = {
        postType,
        categoryId,
        itemName: itemName.trim(),
        description: description.trim(),
        currencyType,
        price: price ? parseInt(price, 10) : undefined,
        priceNegotiable,
      };

      const newPost = await createPost(request);
      router.push(`/post/${newPost.id}`);
    } catch (err) {
      console.error("게시글 작성 실패:", err);
      setError(err instanceof Error ? err.message : "게시글 작성에 실패했습니다");
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
            <h1 className="font-semibold text-lg">글쓰기</h1>
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

          {/* 거래 유형 선택 (팔아요/구해요) */}
          <div>
            <label className="block text-primary font-semibold mb-2">거래 유형</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPostType("SELL")}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  postType === "SELL"
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                팔아요
              </button>
              <button
                type="button"
                onClick={() => setPostType("BUY")}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  postType === "BUY"
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
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
                {currencyType === "BELL" ? "벨" : "마일"}
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
            <div className="flex gap-3 overflow-x-auto pb-2">
              {/* 이미지 추가 버튼 */}
              <button
                type="button"
                onClick={handleImageAdd}
                className="w-16 h-16 flex-shrink-0 border-2 border-primary border-dashed rounded-lg flex items-center justify-center hover:bg-primary/5 transition-colors"
              >
                <PlusIcon className="w-8 h-8 text-primary" />
              </button>

              {/* 업로드된 이미지 미리보기 */}
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    📷
                  </div>
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
            <p className="text-xs text-gray-400 mt-1">최대 10장까지 등록 가능</p>
          </div>
        </div>

        {/* 작성하기 버튼 */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!itemName.trim() || !description.trim() || !categoryId || isSubmitting}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "등록 중..." : "작성하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
