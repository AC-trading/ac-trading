"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MobileLayout } from "@/components/common";
import { HeartIcon, HomeOutlineIcon, MoreVerticalIcon, BlockIcon, FlagIcon } from "@/components/icons";
import { useState, useEffect } from "react";
import {
  getPost,
  formatPrice,
  formatRelativeTime,
  getStatusLabel,
  Post,
  createPriceOffer,
  togglePostLike,
  PriceOfferCreateRequest,
  blockUser,
  createReport,
  ReportReasonCode,
} from "@/lib/postApi";

// 신고 사유 옵션
const REPORT_REASONS: { code: ReportReasonCode; label: string }[] = [
  { code: "HACKED_ITEM", label: "해킹 아이템" },
  { code: "DUPLICATE_POST", label: "중복 게시글" },
  { code: "ABUSIVE_LANGUAGE", label: "욕설/비방" },
  { code: "REAL_MONEY_TRADE", label: "현금 거래" },
  { code: "SCAM", label: "사기" },
  { code: "EXTERNAL_MESSENGER", label: "외부 메신저 유도" },
  { code: "OTHER", label: "기타" },
];

// 상품 상세 페이지 - Figma 디자인 기반
export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  // params.id가 string[] 일 수 있으므로 안전하게 처리
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 가격 제안 모달 상태
  const [showPriceOfferModal, setShowPriceOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerCurrencyType, setOfferCurrencyType] = useState<"BELL" | "MILE_TICKET">("BELL");
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState(false);

  // 더보기 메뉴 바텀시트 상태
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // 신고하기 모달 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<ReportReasonCode | null>(null);
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  // 차단하기 상태
  const [isBlocking, setIsBlocking] = useState(false);

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
        setLikeCount(data.likeCount);
        // 게시글의 화폐 타입으로 초기화
        if (data.currencyType) {
          setOfferCurrencyType(data.currencyType);
        }
      } catch (err) {
        console.error("게시글 로드 실패:", err);
        setError(err instanceof Error ? err.message : "게시글을 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  // 좋아요 토글 핸들러
  const handleLikeToggle = async () => {
    if (!post) return;

    try {
      const result = await togglePostLike(post.id, isLiked);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (err) {
      console.error("좋아요 실패:", err);
      alert(err instanceof Error ? err.message : "좋아요에 실패했습니다");
    }
  };

  // 가격 제안 제출 핸들러
  const handlePriceOfferSubmit = async () => {
    if (!post || !offerPrice) return;

    const price = parseInt(offerPrice, 10);
    if (isNaN(price) || price <= 0) {
      setOfferError("올바른 가격을 입력해주세요");
      return;
    }

    setIsSubmittingOffer(true);
    setOfferError(null);

    try {
      const request: PriceOfferCreateRequest = {
        offeredPrice: price,
        currencyType: offerCurrencyType,
      };
      await createPriceOffer(post.id, request);
      setOfferSuccess(true);
      setTimeout(() => {
        setShowPriceOfferModal(false);
        setOfferSuccess(false);
        setOfferPrice("");
      }, 1500);
    } catch (err) {
      console.error("가격 제안 실패:", err);
      setOfferError(err instanceof Error ? err.message : "가격 제안에 실패했습니다");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // 사용자 차단 핸들러
  const handleBlockUser = async () => {
    if (!post) return;

    setIsBlocking(true);
    try {
      await blockUser(String(post.userId));
      setShowMoreMenu(false);
      alert("해당 사용자를 차단했습니다. 더 이상 이 사용자의 글을 볼 수 없습니다.");
      router.push("/");
    } catch (err) {
      console.error("차단 실패:", err);
      alert(err instanceof Error ? err.message : "차단에 실패했습니다");
    } finally {
      setIsBlocking(false);
    }
  };

  // 신고 제출 핸들러
  const handleReportSubmit = async () => {
    if (!post || !selectedReportReason) return;

    setIsSubmittingReport(true);
    setReportError(null);

    try {
      await createReport({
        postId: post.id,
        reasonCode: selectedReportReason,
        description: reportDescription || undefined,
      });
      setShowReportModal(false);
      setSelectedReportReason(null);
      setReportDescription("");
      alert("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
    } catch (err) {
      console.error("신고 실패:", err);
      setReportError(err instanceof Error ? err.message : "신고에 실패했습니다");
    } finally {
      setIsSubmittingReport(false);
    }
  };

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
          <button
            onClick={() => setShowMoreMenu(true)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVerticalIcon className="w-6 h-6 text-gray-800" />
          </button>
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
        <p className="text-sm text-gray-400">관심 {likeCount}</p>
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-[390px] mx-auto flex items-center justify-between p-4">
          {/* 좋아요 버튼 */}
          <button
            onClick={handleLikeToggle}
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
                <button
                  onClick={() => setShowPriceOfferModal(true)}
                  className="text-sm font-medium text-[#5BBFB3] hover:text-[#7ECEC5] transition-colors"
                >
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

      {/* 가격 제안 모달 */}
      {showPriceOfferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="w-full max-w-[390px] bg-white rounded-t-2xl p-4 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">가격 제안하기</h3>
              <button
                onClick={() => {
                  setShowPriceOfferModal(false);
                  setOfferError(null);
                  setOfferPrice("");
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* 현재 가격 표시 */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">현재 가격</p>
              <p className="text-lg font-semibold text-primary">
                {formatPrice(post.price, post.currencyType)}
              </p>
            </div>

            {/* 화폐 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">화폐</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOfferCurrencyType("BELL")}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    offerCurrencyType === "BELL"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  벨
                </button>
                <button
                  type="button"
                  onClick={() => setOfferCurrencyType("MILE_TICKET")}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    offerCurrencyType === "MILE_TICKET"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  마일
                </button>
              </div>
            </div>

            {/* 가격 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제안 가격</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="flex-1 px-4 py-3 focus:outline-none text-gray-900"
                  placeholder="제안할 가격을 입력하세요"
                />
                <span className="px-4 text-primary font-medium">
                  {offerCurrencyType === "BELL" ? "벨" : "마일"}
                </span>
              </div>
            </div>

            {/* 에러 메시지 */}
            {offerError && (
              <p className="text-sm text-red-500">{offerError}</p>
            )}

            {/* 성공 메시지 */}
            {offerSuccess && (
              <p className="text-sm text-green-500">가격 제안이 완료되었습니다!</p>
            )}

            {/* 제출 버튼 */}
            <button
              onClick={handlePriceOfferSubmit}
              disabled={!offerPrice || isSubmittingOffer}
              className="w-full py-4 bg-[#5BBFB3] text-white font-semibold rounded-xl hover:bg-[#4DAE9F] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmittingOffer ? "제안 중..." : "제안하기"}
            </button>
          </div>
        </div>
      )}

      {/* 하단 바 높이만큼 여백 */}
      <div className="h-20" />

      {/* 더보기 메뉴 바텀시트 */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="w-full max-w-[390px] bg-white rounded-t-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 핸들 바 */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* 메뉴 아이템들 */}
            <div className="pb-6">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  handleBlockUser();
                }}
                disabled={isBlocking}
                className="flex items-center gap-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <BlockIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-800">이 사용자의 글 보지 않기</span>
              </button>
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowReportModal(true);
                }}
                className="flex items-center gap-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <FlagIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-800">신고하기</span>
              </button>
            </div>

            {/* 취소 버튼 */}
            <button
              onClick={() => setShowMoreMenu(false)}
              className="w-full py-4 border-t border-gray-100 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 신고하기 모달 */}
      {showReportModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="w-full max-w-[390px] bg-white rounded-t-2xl overflow-hidden animate-slide-up max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold">신고하기</h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedReportReason(null);
                  setReportDescription("");
                  setReportError(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <span className="text-xl text-gray-500">✕</span>
              </button>
            </div>

            {/* 신고 사유 선택 */}
            <div className="p-4 space-y-2">
              <p className="text-sm text-gray-600 mb-3">신고 사유를 선택해주세요</p>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.code}
                  onClick={() => setSelectedReportReason(reason.code)}
                  className={`w-full px-4 py-3 text-left rounded-lg border transition-colors ${
                    selectedReportReason === reason.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            {/* 추가 설명 */}
            {selectedReportReason && (
              <div className="px-4 pb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추가 설명 (선택)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="신고 내용을 자세히 적어주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-primary"
                  rows={3}
                />
              </div>
            )}

            {/* 에러 메시지 */}
            {reportError && (
              <p className="px-4 pb-2 text-sm text-red-500">{reportError}</p>
            )}

            {/* 제출 버튼 */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleReportSubmit}
                disabled={!selectedReportReason || isSubmittingReport}
                className="w-full py-4 bg-[#5BBFB3] text-white font-semibold rounded-xl hover:bg-[#4DAE9F] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmittingReport ? "신고 중..." : "신고하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
