"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { MobileLayout } from "@/components/common";
import { ChevronLeftIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";

if (!process.env.NEXT_PUBLIC_API_URL) throw new Error('NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.');
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface BlockedUser {
  id: number;
  blockedUserId: number;
  blockedUserNickname: string;
  createdAt: string;
}

// 차단 사용자 목록 관리 페이지
export default function BlockedUsersPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<BlockedUser | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/api/blocks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blocks ?? []);
      }
    } catch (err) {
      console.error("차단 목록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleUnblock = async () => {
    if (!confirmTarget || !accessToken) return;
    setIsUnblocking(true);
    try {
      const res = await fetch(`${API_URL}/api/blocks/${confirmTarget.blockedUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setBlockedUsers((prev) => prev.filter((u) => u.blockedUserId !== confirmTarget.blockedUserId));
      }
    } catch (err) {
      console.error("차단 해제 실패:", err);
    } finally {
      setIsUnblocking(false);
      setConfirmTarget(null);
    }
  };

  return (
    <MobileLayout>
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4 gap-2">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="text-black" />
          </button>
          <h1 className="font-semibold text-lg text-black">차단 사용자 관리</h1>
        </div>
      </header>

      {/* 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-sm">차단한 사용자가 없습니다.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {blockedUsers.map((user) => (
            <li key={user.id}>
              <button
                onClick={() => setConfirmTarget(user)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-black">{user.blockedUserNickname}</span>
                <span className="text-xs text-gray-400">차단 해제</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 차단 해제 확인 모달 */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl mx-6 w-full max-w-sm overflow-hidden">
            <div className="px-6 py-6 text-center">
              <p className="text-base font-semibold text-gray-900">
                {confirmTarget.blockedUserNickname}
              </p>
              <p className="mt-2 text-sm text-gray-500">차단을 해제하시겠습니까?</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-4 text-sm text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100"
              >
                아니오
              </button>
              <button
                onClick={handleUnblock}
                disabled={isUnblocking}
                className="flex-1 py-4 text-sm font-semibold text-primary hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isUnblocking ? "처리 중..." : "예"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
