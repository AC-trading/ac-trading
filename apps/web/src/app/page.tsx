"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { MobileLayout, Header } from "@/components/common";
import { HeartIcon, CommentIcon, PlusIcon } from "@/components/icons";
import {
  getPosts,
  formatPrice,
  formatRelativeTime,
  Post,
} from "@/lib/postApi";

// 거래글 아이템 컴포넌트
function PostItem({ post }: { post: Post }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      {/*
        상품 카테고리 아이콘
        - 거래하는 아이템 카테고리에 따라 아이콘이 변경됨
        - 아이콘 위치: /public/icons/
        - 카테고리별 아이콘: DIY.png, bell.png, clothes.png, fossil.png,
          island.png, mile ticket.png, radish.png 등
      */}
      <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src="/icons/DIY.png"
          alt="상품 카테고리"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 상품 정보 */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h3 className="font-medium text-gray-900 line-clamp-2">{post.itemName}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {post.userIslandName || "섬 이름 없음"} · {formatRelativeTime(post.bumpedAt || post.createdAt)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-bold text-primary">{formatPrice(post.price, post.currencyType)}</p>
          <div className="flex items-center gap-3 text-gray-400">
            {post.likeCount > 0 && (
              <span className="flex items-center gap-1">
                <HeartIcon className="w-4 h-4" />
                <span className="text-xs">{post.likeCount}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// 홈 페이지 (거래글 목록) - Figma 디자인 기반
export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 게시글 목록 로드
  useEffect(() => {
    async function loadPosts() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getPosts({ page: 0, size: 20 });
        setPosts(response.posts);
      } catch (err) {
        console.error("게시글 로드 실패:", err);
        setError(err instanceof Error ? err.message : "게시글을 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    loadPosts();
  }, []);

  return (
    <MobileLayout>
      <Header showLocation showSearch showBell />

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">🏝️</span>
          <p>아직 등록된 거래글이 없어요</p>
          <p className="text-sm mt-1">첫 번째 거래글을 등록해보세요!</p>
        </div>
      )}

      {/* 거래글 목록 */}
      {!isLoading && !error && posts.length > 0 && (
        <div className="divide-y divide-gray-100">
          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 글쓰기 FAB 버튼 */}
      <Link
        href="/post/new"
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors z-40"
        style={{ right: "calc(50% - 195px + 16px)" }}
      >
        <PlusIcon className="text-white" />
      </Link>
    </MobileLayout>
  );
}
