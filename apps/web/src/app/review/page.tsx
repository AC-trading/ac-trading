"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeftIcon, StarIcon } from "@/components/icons";
import { getPost, createReview, Post } from "@/lib/postApi";

// 리뷰 작성 폼 컴포넌트 (useSearchParams 사용을 위해 분리)
function ReviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL 쿼리 파라미터에서 postId, revieweeId 추출
  const postId = searchParams.get("postId");
  const revieweeId = searchParams.get("revieweeId");

  // 게시글 정보 로드
  const [post, setPost] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  useEffect(() => {
    if (!postId) return;

    async function loadPost() {
      // Before: parseInt NaN 검증 없음
      // After: NaN 검증 추가
      const parsedId = parseInt(postId!, 10);
      if (isNaN(parsedId)) {
        console.error("잘못된 postId:", postId);
        return;
      }
      setIsLoadingPost(true);
      try {
        const postData = await getPost(parsedId);
        setPost(postData);
      } catch (err) {
        console.error("게시글 로드 실패:", err);
      } finally {
        setIsLoadingPost(false);
      }
    }
    loadPost();
  }, [postId]);

  // 후기 제출
  const handleSubmit = async () => {
    if (rating === 0) return;
    if (!postId || !revieweeId) {
      setError("거래 정보가 없습니다");
      return;
    }

    // Before: NaN 검증이 setIsSubmitting(true) 이후에 위치 → 조기 return 시 isSubmitting이 true로 고정됨
    // After: NaN 검증을 setIsSubmitting 전에 수행하여 finally 블록 누락 방지
    const parsedPostId = parseInt(postId, 10);
    const parsedRevieweeId = parseInt(revieweeId, 10);
    if (isNaN(parsedPostId) || isNaN(parsedRevieweeId)) {
      setError("잘못된 거래 정보입니다");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createReview({
        postId: parsedPostId,
        revieweeId: parsedRevieweeId,
        rating,
        comment: review.trim() || undefined,
      });
      router.push("/");
    } catch (err) {
      console.error("리뷰 작성 실패:", err);
      setError(err instanceof Error ? err.message : "후기 등록에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  // postId나 revieweeId가 없는 경우 (프로필 > 나의 활동에서 진입)
  if (!postId || !revieweeId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-6xl mb-4">📝</span>
        <p>거래 완료 후 후기를 남길 수 있어요</p>
        <p className="text-sm mt-2">채팅방에서 거래 완료 후 후기 작성 버튼을 눌러주세요</p>
        <Link
          href="/collection?tab=my"
          className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          내 거래글 보기
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* 컨텐츠 */}
      <div className="flex-1 p-4">
        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 상품 정보 */}
        {isLoadingPost ? (
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2 mt-2" />
            </div>
          </div>
        ) : post ? (
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
              {/* Before: 하드코딩 <img> 태그
                 After: 환경변수 + Next.js Image 컴포넌트 */}
              <Image
                src={process.env.NEXT_PUBLIC_ICON_RACCOON || "/icons/raccoon_bill.svg"}
                alt="상품"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{post.itemName}</p>
              <p className="text-xs text-gray-500">{post.userNickname || "판매자"}</p>
            </div>
          </div>
        ) : null}

        {/* 후기 안내 */}
        <div className="py-6">
          <h2 className="text-lg font-semibold text-gray-900">
            거래가 어떠셨나요?
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            남겨주신 후기는 거동숲에 도움이 됩니다
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
            className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "등록 중..." : "후기 보내기"}
        </button>
      </div>
    </>
  );
}

// 거래 후기 페이지
export default function ReviewPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full min-h-screen bg-white flex flex-col">
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

        {/* Suspense로 감싸서 useSearchParams 사용 */}
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          <ReviewForm />
        </Suspense>
      </div>
    </div>
  );
}
