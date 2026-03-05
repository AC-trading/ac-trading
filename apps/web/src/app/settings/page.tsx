"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MobileLayout } from "@/components/common";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";

// 설정 페이지
export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <MobileLayout>
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4 gap-2">
          <button
            onClick={() => router.back()}
            aria-label="이전 페이지로 이동"
            className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="text-black" />
          </button>
          <h1 className="font-semibold text-lg text-black">설정</h1>
        </div>
      </header>

      {/* 메뉴 */}
      <div className="divide-y divide-gray-100">
        {/* 내 계정 */}
        <Link
          href="/profile/edit"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-black">내 계정</span>
          <ChevronRightIcon className="text-gray-400" />
        </Link>

        {/* 차단 사용자 관리 */}
        <Link
          href="/settings/blocked"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-black">차단 사용자 관리</span>
          <ChevronRightIcon className="text-gray-400" />
        </Link>

        {/* 공지사항 */}
        <Link
          href="/settings/notice"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-black">공지사항</span>
          <ChevronRightIcon className="text-gray-400" />
        </Link>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
        >
          <span className="text-black">{isLoggingOut ? "로그아웃 중..." : "로그아웃"}</span>
        </button>

        {/* 탈퇴하기 */}
        <Link
          href="/account-delete"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-red-500">탈퇴하기</span>
        </Link>
      </div>
    </MobileLayout>
  );
}
