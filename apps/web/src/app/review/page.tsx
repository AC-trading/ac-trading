"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, StarIcon } from "@/components/icons";

// 거래 후기 페이지 - Figma 디자인 기반
export default function ReviewPage() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  // 더미 상품/거래 정보
  const transaction = {
    product: {
      title: "산악자전거 장기대여 가능합니다~!",
      image: "/images/bike.jpg",
    },
    seller: {
      name: "user 1",
    },
    buyer: {
      name: "user2",
    },
  };

  const handleSubmit = () => {
    // TODO: 실제 후기 제출 로직
    alert("후기가 등록되었습니다!");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[390px] min-h-screen bg-white flex flex-col">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="text-gray-800" />
            </button>
            <h1 className="font-semibold text-lg">거래 후기 보내기</h1>
            <div className="w-8" />
          </div>
        </header>

        {/* 컨텐츠 */}
        <div className="flex-1 p-4">
          {/* 상품 정보 */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
              🚲
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{transaction.product.title}</p>
              <p className="text-xs text-gray-500">{transaction.seller.name}</p>
            </div>
          </div>

          {/* 후기 안내 */}
          <div className="py-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {transaction.buyer.name}님,
              <br />
              {transaction.seller.name}님과의 거래가 어떠셨나요?
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              남겨주신 후기는 당근이지에 도움이 됩니다
            </p>
          </div>

          {/* 별점 */}
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <StarIcon filled={star <= rating} />
              </button>
            ))}
          </div>

          {/* 후기 작성 */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              어떤 점이 좋고, 어떤 점이 별로였나요?
              <br />
              후기를 적어주세요!
            </h3>
            <textarea
              placeholder="여기에 적어주세요!"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            후기 보내기
          </button>
        </div>
      </div>
    </div>
  );
}
