"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HomeOutlineIcon, SearchIcon, MenuIcon, PlusIcon } from "@/components/icons";

// 상품 등록 페이지 - Figma 디자인 기반
export default function NewPostPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    price: "",
    currencyType: "벨" as "벨" | "마일",
  });
  const [images, setImages] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = () => {
    // TODO: 실제 상품 등록 API 호출 후 반환된 ID 사용
    // 임시로 랜덤 ID 생성
    const newPostId = Date.now();

    // sessionStorage에 데이터 저장 (URL 길이 제한 회피)
    sessionStorage.setItem(
      `post_${newPostId}`,
      JSON.stringify({ ...formData, images })
    );

    router.push(`/post/${newPostId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[390px] min-h-screen bg-white flex flex-col">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <Link href="/" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <HomeOutlineIcon className="w-6 h-6 text-gray-800" />
            </Link>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <SearchIcon className="w-6 h-6 text-gray-800" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <MenuIcon className="w-6 h-6 text-gray-800" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-800">
                  <circle cx="12" cy="6" r="2" fill="currentColor" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <circle cx="12" cy="18" r="2" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* 폼 컨텐츠 */}
        <div className="flex-1 p-4 space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-primary font-semibold mb-2">제목</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              placeholder="상품명을 입력하세요"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-primary font-semibold mb-2">내용</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              placeholder="상품에 대한 설명을 적어주세요"
            />
          </div>

          {/* 화폐 유형 선택 */}
          <div>
            <label className="block text-primary font-semibold mb-2">화폐</label>
            <div className="flex gap-2">
              {(["벨", "마일"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, currencyType: type }))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    formData.currencyType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 가격 */}
          <div>
            <label className="block text-primary font-semibold mb-2">가격</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="flex-1 px-4 py-3 focus:outline-none text-gray-900"
                placeholder="가격을 입력해주세요.."
              />
              <span className="px-4 text-primary font-medium">
                {formData.currencyType === "벨" ? "덩" : "마일"}
              </span>
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {/* 이미지 추가 버튼 */}
              <button
                onClick={handleImageAdd}
                className="w-16 h-16 flex-shrink-0 border-2 border-primary border-dashed rounded-lg flex items-center justify-center hover:bg-orange-50 transition-colors"
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
                    🚲
                  </div>
                  <button
                    onClick={() => handleImageRemove(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 작성하기 버튼 */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!formData.title || !formData.content}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            작성하기
          </button>
        </div>
      </div>
    </div>
  );
}
