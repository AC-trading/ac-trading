"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MobileLayout, Header } from "@/components/common";
import { HeartIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { getMyLikes, Post, togglePostLike } from "@/lib/postApi";

// 관심 상품 아이템 컴포넌트
function FavoriteItem({
  post,
  onUnlike,
}: {
  post: Post;
  onUnlike: (postId: number) => void;
}) {
  // 가격 포맷팅
  const formatPrice = (price: number | null, currencyType: string | null) => {
    if (price === null) return "가격 미정";
    if (currencyType === "MILE_TICKET") return `마일 티켓 ${price}장`;
    return `${price.toLocaleString()} 벨`;
  };

  // 거래 상태 배지
  const getStatusBadge = (status: string) => {
    switch (status) {
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
    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
      {/* 상품 이미지 */}
      <Link href={`/posts/${post.id}`} className="flex-shrink-0">
        <Image
          src="/icons/island.png"
          alt={post.itemName}
          width={80}
          height={80}
          className="w-20 h-20 rounded-lg object-cover bg-gray-100"
        />
      </Link>

      {/* 상품 정보 */}
      <Link href={`/posts/${post.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getStatusBadge(post.status)}
          <span className="text-sm text-gray-400">{post.categoryName}</span>
        </div>
        <h3 className="font-medium text-gray-900 truncate mt-1">{post.itemName}</h3>
        <p className="text-primary font-semibold mt-1">
          {formatPrice(post.price, post.currencyType)}
        </p>
      </Link>

      {/* 찜 해제 버튼 */}
      <button
        onClick={() => onUnlike(post.id)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
        aria-label="관심 해제"
      >
        <HeartIcon filled className="w-6 h-6" />
      </button>
    </div>
  );
}

// 관심목록 페이지
export default function FavoritesPage() {
  const { isLoggedIn } = useAuth();
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 관심목록 불러오기
  useEffect(() => {
    async function fetchFavorites() {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMyLikes(0, 50);
        setFavorites(response.content);
      } catch (err) {
        console.error("관심목록 조회 실패:", err);
        setError("관심목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [isLoggedIn]);

  // 찜 해제 핸들러
  const handleUnlike = async (postId: number) => {
    try {
      await togglePostLike(postId, true); // 현재 liked 상태이므로 unlike 호출
      setFavorites((prev) => prev.filter((post) => post.id !== postId));
    } catch (err) {
      console.error("찜 해제 실패:", err);
    }
  };

  // 로그인 필요
  if (!isLoggedIn) {
    return (
      <MobileLayout>
        <Header title="관심목록" showBack onBack={() => window.history.back()} />
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Image
            src="/icons/island.png"
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
      {/* 헤더 */}
      <Header title="관심목록" showBack onBack={() => window.history.back()} />

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

      {/* 관심목록 */}
      {!loading && !error && favorites.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 text-gray-500 text-sm">
            총 {favorites.length}개
          </div>
          {favorites.map((post) => (
            <FavoriteItem key={post.id} post={post} onUnlike={handleUnlike} />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && !error && favorites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Image
            src="/icons/island.png"
            alt="빈 관심목록"
            width={120}
            height={120}
            className="mb-4 opacity-50"
          />
          <p className="text-lg">아직 관심 물품이 없어요</p>
          <p className="text-sm mt-1">마음에 드는 상품을 찜해보세요!</p>
          <Link
            href="/"
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm"
          >
            상품 구경하기
          </Link>
        </div>
      )}
    </MobileLayout>
  );
}
