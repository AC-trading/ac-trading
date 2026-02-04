"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { MobileLayout, Header } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import {
  getKeywordAlarms,
  createKeywordAlarm,
  deleteKeywordAlarm,
  KeywordAlarm,
  formatRelativeTime,
} from "@/lib/postApi";

// 키워드 아이템 컴포넌트
function KeywordItem({
  keyword,
  onDelete,
  isDeleting,
}: {
  keyword: KeywordAlarm;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div className="flex-1">
        <span className="font-medium text-gray-900">{keyword.keyword}</span>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatRelativeTime(keyword.createdAt)} 등록
        </p>
      </div>
      <button
        onClick={() => onDelete(keyword.id)}
        disabled={isDeleting}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

// 키워드 알림 페이지
export default function KeywordAlarmPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [keywords, setKeywords] = useState<KeywordAlarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 입력 상태
  const [newKeyword, setNewKeyword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 삭제 중인 키워드 ID
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 키워드 목록 로드
  useEffect(() => {
    async function loadKeywords() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await getKeywordAlarms();
        setKeywords(response.keywords);
      } catch (err) {
        console.error("키워드 로드 실패:", err);
        setError(err instanceof Error ? err.message : "키워드를 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadKeywords();
    }
  }, [isAuthenticated, authLoading]);

  // 키워드 추가
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedKeyword = newKeyword.trim();
    if (!trimmedKeyword) return;

    // CodeRabbit 리뷰 반영: 서버 요청 전 클라이언트에서 30개 제한 선제 검증
    if (keywords.length >= 30) {
      setSubmitError("키워드는 최대 30개까지 등록할 수 있습니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const created = await createKeywordAlarm(trimmedKeyword);
      setKeywords((prev) => [created, ...prev]);
      setNewKeyword("");
    } catch (err) {
      console.error("키워드 추가 실패:", err);
      setSubmitError(err instanceof Error ? err.message : "키워드 추가에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 키워드 삭제
  const handleDeleteKeyword = async (id: number) => {
    try {
      setDeletingId(id);
      await deleteKeywordAlarm(id);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error("키워드 삭제 실패:", err);
      alert(err instanceof Error ? err.message : "키워드 삭제에 실패했습니다");
    } finally {
      setDeletingId(null);
    }
  };

  // 로그인 필요 여부
  const needsLogin = !authLoading && !isAuthenticated;

  return (
    <MobileLayout>
      {/* 헤더 */}
      <Header
        title="키워드 알림"
        showBack
        onBack={() => window.history.back()}
      />

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

      {/* 로그인 상태일 때 */}
      {!needsLogin && (
        <>
          {/* 키워드 입력 폼 */}
          <form onSubmit={handleAddKeyword} className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => {
                  setNewKeyword(e.target.value);
                  setSubmitError(null);
                }}
                placeholder="관심 키워드를 입력하세요"
                maxLength={50}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-gray-900"
              />
              <button
                type="submit"
                disabled={!newKeyword.trim() || isSubmitting}
                className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "..." : "추가"}
              </button>
            </div>
            {submitError && (
              <p className="mt-2 text-sm text-red-500">{submitError}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              키워드가 포함된 새 거래글이 등록되면 알림을 받아요 (최대 30개)
            </p>
          </form>

          {/* 키워드 개수 표시 */}
          {keywords.length > 0 && (
            <div className="px-4 py-2 bg-primary-light/30 text-primary text-sm font-medium">
              등록된 키워드 {keywords.length}개
            </div>
          )}

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
          {!isLoading && !error && keywords.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-6xl mb-4">🔔</span>
              <p>등록된 키워드가 없어요</p>
              <p className="text-sm mt-1">관심 있는 키워드를 등록해보세요!</p>
            </div>
          )}

          {/* 키워드 목록 */}
          {!isLoading && !error && keywords.length > 0 && (
            <div>
              {keywords.map((keyword) => (
                <KeywordItem
                  key={keyword.id}
                  keyword={keyword}
                  onDelete={handleDeleteKeyword}
                  isDeleting={deletingId === keyword.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </MobileLayout>
  );
}
