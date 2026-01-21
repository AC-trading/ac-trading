"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { MobileLayout } from "@/components/common";
import { HeartIcon, HomeOutlineIcon } from "@/components/icons";
import { useState, useEffect } from "react";
import {
  getPost,
  formatPrice,
  formatRelativeTime,
  getStatusLabel,
  Post,
} from "@/lib/postApi";

// 상품 상세 페이지 - Figma 디자인 기반
export default function PostDetailPage() {
  const params = useParams();
  // params.id가 string[] 일 수 있으므로 안전하게 처리
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [isLiked, setIsLiked] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API에서 게시글 데이터 로드
  useEffect(() => {
    async function loadPost() {
      if (!postId) return;

      try {
        setIsLoading(true);
        setError(null);
        const postNum = parseInt(postId, 10);
        if (isNaN(postNum)) {
          setError("잘못된 게시글 ID입니다");
          return;
        }
        const data = await getPost(postNum);
        setPost(data);
        setIsLiked(data.isLiked);
      } catch (err) {
        console.error("게시글 로드 실패:", err);
        setError(err instanceof Error ? err.message : "게시글을 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  // 로딩 상태
  if (isLoading) {
    return (
      <MobileLayout hideNav>
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <Link href="/" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <HomeOutlineIcon className="w-6 h-6 text-gray-800" />
            </Link>
            <h1 className="font-semibold text-lg">상품 상세</h1>
            <div className="w-8" />
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </MobileLayout>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <MobileLayout hideNav>
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <Link href="/" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <HomeOutlineIcon className="w-6 h-6 text-gray-800" />
            </Link>
            <h1 className="font-semibold text-lg">상품 상세</h1>
            <div className="w-8" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-6xl mb-4">😢</span>
          <p className="text-sm">{error || "게시글을 찾을 수 없습니다"}</p>
          <Link href="/" className="mt-4 px-4 py-2 text-sm text-primary hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </MobileLayout>
    );
  }

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
      <div className="w-full h-72 bg-gray-100 overflow-hidden flex items-center justify-center">
        <span className="text-6xl">📦</span>
      </div>

      {/* 판매자 정보 */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-2xl">
          🐰
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{post.userNickname || "익명"}</p>
          <p className="text-sm text-gray-500">{post.userIslandName || "섬 이름 없음"}</p>
        </div>
        {post.userMannerScore && (
          <div className="text-right">
            <p className="text-sm font-medium text-primary">{post.userMannerScore}°C</p>
            <p className="text-xs text-gray-400">매너온도</p>
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="p-4 space-y-4">
        {/* 상태 배지 */}
        {post.status !== "AVAILABLE" && (
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
            post.status === "RESERVED" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"
          }`}>
            {getStatusLabel(post.status)}
          </span>
        )}

        {/* 제목 */}
        <h2 className="text-xl font-bold text-gray-900">{post.itemName}</h2>

        {/* 카테고리 & 시간 */}
        <p className="text-sm text-gray-500">
          {post.categoryName || "카테고리 없음"} · {formatRelativeTime(post.bumpedAt || post.createdAt)}
        </p>

        {/* 내용 */}
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {post.description}
        </p>

        {/* 관심/조회 정보 */}
        <p className="text-sm text-gray-400">관심 {post.likeCount}</p>
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

          {/* 가격 & 버튼들 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">
                {formatPrice(post.price, post.currencyType)}
              </span>
              {post.priceNegotiable && (
                <button className="text-sm font-medium text-[#5BBFB3] hover:text-[#7ECEC5] transition-colors">
                  가격 제안하기
                </button>
              )}
            </div>
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
