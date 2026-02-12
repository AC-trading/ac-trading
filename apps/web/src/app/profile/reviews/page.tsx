"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MobileLayout, Header } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { getMyReviews, ReviewResponse, formatRelativeTime } from "@/lib/postApi";

// 리뷰 아이템 컴포넌트
function ReviewItem({ review }: { review: ReviewResponse }) {
  return (
    <div className="p-4 border-b border-gray-100">
      {/* 리뷰 작성자 정보 */}
      <div className="flex items-center gap-3 mb-2">
        <Image
          src={process.env.NEXT_PUBLIC_ICON_ISLAND || "/icons/island.png"}
          alt="프로필"
          width={36}
          height={36}
          className="rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-medium text-sm text-black">
            {review.reviewerNickname || "알 수 없음"}
          </p>
          <p className="text-xs text-gray-400">
            {review.reviewerIslandName || "섬 이름 없음"} · {formatRelativeTime(review.createdAt)}
          </p>
        </div>
      </div>

      {/* 리뷰 내용 */}
      {review.comment && (
        <p className="text-sm text-black mt-2">{review.comment}</p>
      )}

      {/* 관련 게시글 */}
      {review.postItemName && (
        <p className="text-xs text-gray-400 mt-2">
          거래: {review.postItemName}
        </p>
      )}
    </div>
  );
}

// 받은 매너 평가 페이지
export default function ProfileReviewsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      if (authLoading) return;
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await getMyReviews(0, 20);
        setReviews(response.reviews);
        setReviewCount(response.reviewCount ?? response.totalElements);
      } catch (err) {
        console.error("리뷰 로드 실패:", err);
        setError(err instanceof Error ? err.message : "리뷰를 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    loadReviews();
  }, [authLoading, isAuthenticated, router]);

  return (
    <MobileLayout>
      <Header title="받은 매너 평가" showBack onBack={() => router.back()} />

      {/* 로딩 */}
      {(isLoading || authLoading) && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* 에러 */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 통계 */}
      {!isLoading && !error && (
        <>
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800">{reviewCount}</p>
                <p className="text-xs text-gray-500 mt-1">받은 리뷰</p>
              </div>
            </div>
          </div>

          {/* 리뷰 목록 */}
          {reviews.length > 0 ? (
            <div>
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-6xl mb-4">📝</span>
              <p>아직 받은 평가가 없어요</p>
              <p className="text-sm mt-1">거래를 완료하면 평가를 받을 수 있어요!</p>
            </div>
          )}
        </>
      )}
    </MobileLayout>
  );
}
