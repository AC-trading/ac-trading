"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MobileLayout, Header } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import {
  getMyPosts,
  extractImageUrls,
  formatPrice,
  formatRelativeTime,
  getStatusLabel,
  Post,
} from "@/lib/postApi";

// 상태 필터 타입
type StatusFilter = "ALL" | "AVAILABLE" | "RESERVED" | "COMPLETED";

// 상태 필터 옵션
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "AVAILABLE", label: "판매중" },
  { value: "RESERVED", label: "예약중" },
  { value: "COMPLETED", label: "거래완료" },
];

// 판매 게시글 아이템 컴포넌트
function SalesItem({ post }: { post: Post }) {
  const thumbnailUrl = extractImageUrls(post.description)[0];

  // 상태 배지
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
            판매중
          </span>
        );
      case "RESERVED":
        return (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            예약중
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
            거래완료
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Link
      href={`/post/${post.id}`}
      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
    >
      {/* 썸네일 */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={post.itemName}
          className="w-20 h-20 rounded-lg object-cover bg-gray-100 flex-shrink-0"
        />
      ) : (
        <Image
          src={process.env.NEXT_PUBLIC_ICON_ISLAND || "/icons/island.png"}
          alt={post.itemName}
          width={80}
          height={80}
          className="w-20 h-20 rounded-lg object-cover bg-gray-100 flex-shrink-0"
        />
      )}

      {/* 게시글 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getStatusBadge(post.status)}
          <span className="text-sm text-gray-400">{post.categoryName}</span>
        </div>
        <h3 className="font-medium text-gray-900 truncate mt-1">{post.itemName}</h3>
        <p className="text-primary font-semibold mt-1">
          {formatPrice(post.price, post.currencyType)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatRelativeTime(post.bumpedAt || post.createdAt)}
        </p>
      </div>
    </Link>
  );
}

// 판매내역 페이지
export default function SalesPage() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // 내 판매 게시글 불러오기
  useEffect(() => {
    async function fetchSalesPosts() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMyPosts(0, 100);
        // postType === 'SELL'인 게시글만 필터링
        const salesPosts = response.posts.filter((post) => post.postType === "SELL");
        setPosts(salesPosts);
      } catch (err) {
        console.error("판매내역 조회 실패:", err);
        setError("판매내역을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchSalesPosts();
  }, [isAuthenticated]);

  // 상태 필터 적용
  const filteredPosts = statusFilter === "ALL"
    ? posts
    : posts.filter((post) => post.status === statusFilter);

  // 로그인 필요
  if (!isAuthenticated) {
    return (
      <MobileLayout>
        <Header title="판매내역" showBack onBack={() => window.history.back()} />
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Image
            src={process.env.NEXT_PUBLIC_ICON_ISLAND || "/icons/island.png"}
            alt="로그인 필요"
            width={120}
            height={120}
            className="mb-4 opacity-50"
          />
          <p>로그인이 필요한 서비스입니다</p>
          <Link
            href="/login"
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm"
          >
            로그인하기
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <Header title="판매내역" showBack onBack={() => window.history.back()} />

      {/* 상태 필터 탭 */}
      <div className="flex border-b border-gray-100 px-4">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? "text-primary border-b-2 border-primary"
                : "text-gray-400"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p>{error}</p>
        </div>
      )}

      {/* 게시글 목록 */}
      {!loading && !error && filteredPosts.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 text-gray-500 text-sm">
            총 {filteredPosts.length}개
          </div>
          {filteredPosts.map((post) => (
            <SalesItem key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && !error && filteredPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Image
            src={process.env.NEXT_PUBLIC_ICON_ISLAND || "/icons/island.png"}
            alt="빈 판매내역"
            width={120}
            height={120}
            className="mb-4 opacity-50"
          />
          <p className="text-lg">아직 판매 게시글이 없어요</p>
          <p className="text-sm mt-1">물품을 등록해보세요!</p>
          <Link
            href="/post/new"
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm"
          >
            글쓰기
          </Link>
        </div>
      )}
    </MobileLayout>
  );
}
