"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MobileLayout } from "@/components/common";
import { HeartIcon, HomeOutlineIcon } from "@/components/icons";
import { useState } from "react";

// 상품 상세 페이지 - Figma 디자인 기반
export default function PostDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params.id;

  // URL 쿼리로 전달된 데이터 (상품 등록 시 전달)
  const title = searchParams.get("title") || "상품명";
  const content = searchParams.get("content") || "상품 설명이 없습니다.";
  const price = searchParams.get("price") || "0";
  const location = searchParams.get("location") || "위치 정보 없음";
  const images = searchParams.get("images")?.split(",") || [];

  const [isLiked, setIsLiked] = useState(false);

  // 가격 포맷팅
  const formatPrice = (priceStr: string) => {
    const num = parseInt(priceStr, 10);
    if (isNaN(num)) return "가격 미정";
    return num.toLocaleString("ko-KR") + "원";
  };

  return (
    <MobileLayout hideNav>
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          <Link
            href="/"
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HomeOutlineIcon className="w-6 h-6 text-gray-800" />
          </Link>
          <h1 className="font-semibold text-lg">상품 상세</h1>
          <div className="w-8" /> {/* 균형을 위한 빈 공간 */}
        </div>
      </header>

      {/* 상품 이미지 */}
      <div className="w-full h-72 bg-gray-100 overflow-hidden">
        {images.length > 0 ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory h-full">
            {images.map((img, index) => (
              <div
                key={index}
                className="w-full h-full flex-shrink-0 snap-center bg-gray-200 flex items-center justify-center"
              >
                <span className="text-6xl">🚲</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">📦</span>
          </div>
        )}
      </div>

      {/* 판매자 정보 */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-2xl">
          🐰
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">판매자</p>
          <p className="text-sm text-gray-500">{location}</p>
        </div>
      </div>

      {/* 상품 정보 */}
      <div className="p-4 space-y-4">
        {/* 제목 */}
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>

        {/* 카테고리 & 시간 */}
        <p className="text-sm text-gray-500">게임/취미 · 방금 전</p>

        {/* 내용 */}
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>

        {/* 관심/조회 정보 */}
        <p className="text-sm text-gray-400">관심 0 · 조회 1</p>
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-[390px] mx-auto flex items-center justify-between p-4">
          {/* 좋아요 버튼 */}
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HeartIcon filled={isLiked} className="w-6 h-6" />
          </button>

          {/* 가격 & 채팅 버튼 */}
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-primary">
              {formatPrice(price)}
            </span>
            <Link
              href={`/chat/new?postId=${postId}`}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              채팅하기
            </Link>
          </div>
        </div>
      </div>

      {/* 하단 바 높이만큼 여백 */}
      <div className="h-20" />
    </MobileLayout>
  );
}
