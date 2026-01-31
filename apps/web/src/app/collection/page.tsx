"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { MobileLayout, Header } from "@/components/common";
import { HeartIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import {
  getMyLikes,
  getMyPosts,
  getPost,
  formatPrice,
  formatRelativeTime,
  Post,
} from "@/lib/postApi";
import { getRecentViewedPostIds, clearRecentViewedPosts } from "@/lib/recentPosts";

// 탭 타입
type TabType = "likes" | "recent" | "my";

// 탭 정보
const tabs: { id: TabType; label: string }[] = [
  { id: "likes", label: "관심목록" },
  { id: "recent", label: "최근 본 글" },
  { id: "my", label: "내 거래글" },
];

// 거래글 아이템 컴포넌트 (홈 페이지와 동일한 디자인)
function PostItem({ post }: { post: Post }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      {/* 상품 카테고리 아이콘 */}
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

// 모아보기 페이지
export default function CollectionPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("likes");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    async function loadPosts() {
      // 로그인 필요한 탭 체크
      if ((activeTab === "likes" || activeTab === "my") && !isAuthenticated) {
        setPosts([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        if (activeTab === "likes") {
          // 관심목록: 서버 API 호출
          const response = await getMyLikes(0, 50);
          setPosts(response.posts);
        } else if (activeTab === "recent") {
          // 최근 본 글: localStorage에서 ID 목록 조회 후 각 게시글 정보 로드
          const recentIds = getRecentViewedPostIds();
          if (recentIds.length === 0) {
            setPosts([]);
          } else {
            // 각 게시글 정보를 병렬로 로드 (삭제된 게시글은 제외)
            const postPromises = recentIds.map(async (id) => {
              try {
                return await getPost(id);
              } catch {
                // 삭제된 게시글은 null 반환
                return null;
              }
            });
            const results = await Promise.all(postPromises);
            setPosts(results.filter((p): p is Post => p !== null));
          }
        } else if (activeTab === "my") {
          // 내 거래글: 서버 API 호출
          const response = await getMyPosts(0, 50);
          setPosts(response.posts);
        }
      } catch (err) {
        console.error("게시글 로드 실패:", err);
        setError(err instanceof Error ? err.message : "게시글을 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    // 인증 로딩 중이면 대기
    if (!authLoading) {
      loadPosts();
    }
  }, [activeTab, isAuthenticated, authLoading]);

  // 최근 본 글 초기화
  const handleClearRecent = () => {
    clearRecentViewedPosts();
    if (activeTab === "recent") {
      setPosts([]);
    }
  };

  // 빈 상태 메시지
  const getEmptyMessage = () => {
    switch (activeTab) {
      case "likes":
        return {
          emoji: "💚",
          title: "관심 등록한 거래글이 없어요",
          subtitle: "마음에 드는 거래글에 하트를 눌러보세요",
        };
      case "recent":
        return {
          emoji: "👀",
          title: "최근 본 거래글이 없어요",
          subtitle: "거래글을 둘러보고 다시 와보세요",
        };
      case "my":
        return {
          emoji: "📝",
          title: "작성한 거래글이 없어요",
          subtitle: "첫 번째 거래글을 등록해보세요",
        };
    }
  };

  // 로그인 필요 메시지
  const needsLogin = (activeTab === "likes" || activeTab === "my") && !authLoading && !isAuthenticated;

  return (
    <MobileLayout>
      {/* 헤더 */}
      <Header
        title="모아보기"
        showBack
        onBack={() => window.history.back()}
        rightElement={
          activeTab === "recent" && posts.length > 0 ? (
            <button
              onClick={handleClearRecent}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              전체 삭제
            </button>
          ) : undefined
        }
      />

      {/* 탭 바 */}
      <div className="flex border-b border-gray-200 bg-white sticky top-14 z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로그인 필요 안내 */}
      {needsLogin && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">🔒</span>
          <p>로그인이 필요해요</p>
          <Link
            href="/login"
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            로그인
          </Link>
        </div>
      )}

      {/* 로딩 상태 */}
      {!needsLogin && isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* 에러 상태 */}
      {!needsLogin && error && !isLoading && (
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
      {!needsLogin && !isLoading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-6xl mb-4">{getEmptyMessage().emoji}</span>
          <p>{getEmptyMessage().title}</p>
          <p className="text-sm mt-1">{getEmptyMessage().subtitle}</p>
          {activeTab === "my" && (
            <Link
              href="/post/new"
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              거래글 작성
            </Link>
          )}
        </div>
      )}

      {/* 거래글 목록 */}
      {!needsLogin && !isLoading && !error && posts.length > 0 && (
        <div className="divide-y divide-gray-100">
          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </MobileLayout>
  );
}
