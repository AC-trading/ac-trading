"use client";

import Link from "next/link";
import { MobileLayout, Header } from "@/components/common";
import {
  SettingsIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
  HeartIcon,
  ListIcon,
} from "@/components/icons";
import { useAuth } from "@/context/AuthContext";

// 프로필 메뉴 아이템 컴포넌트
function MenuItem({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-500">{icon}</span>
      <span className="flex-1 text-gray-800">{label}</span>
      <ChevronRightIcon className="text-gray-400" />
    </Link>
  );
}

// 프로필 페이지 - Figma 디자인 기반
export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // 비로그인 상태
  if (!isLoading && !isAuthenticated) {
    return (
      <MobileLayout>
        <Header title="나의 거동숲" />
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-6xl mb-4">🔒</span>
          <p className="text-sm">로그인이 필요합니다</p>
          <Link href="/login" className="mt-4 px-6 py-2 bg-primary text-white rounded-lg">
            로그인하기
          </Link>
        </div>
      </MobileLayout>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <MobileLayout>
        <Header title="나의 거동숲" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* 헤더 */}
      <Header
        title="나의 거동숲"
        rightElement={
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <SettingsIcon className="text-gray-800" />
          </button>
        }
      />

      {/* 프로필 정보 */}
      <Link
        href="/profile/edit"
        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
      >
        {/* 프로필 이미지 */}
        <div className="w-14 h-14 rounded-full bg-[#BAE8E7] flex items-center justify-center text-2xl">
          {user?.nickname?.charAt(0) || "👤"}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-lg">{user?.nickname || "닉네임 없음"}</h2>
          <p className="text-sm text-gray-500">
            {user?.islandName || "섬 이름 없음"}
          </p>
        </div>
        <ChevronRightIcon className="text-gray-400" />
      </Link>


      {/* 거래 관련 메뉴 */}
      <div className="flex justify-around py-4 border-b border-gray-100">
        <Link
          href="/profile/sales"
          className="flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-full bg-[#BAE8E7] flex items-center justify-center">
            <ShoppingBagIcon className="text-primary" />
          </div>
          <span className="text-sm text-gray-700">판매내역</span>
        </Link>
        <Link
          href="/profile/purchases"
          className="flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-full bg-[#BAE8E7] flex items-center justify-center">
            <ShoppingBagIcon className="text-primary" />
          </div>
          <span className="text-sm text-gray-700">구매내역</span>
        </Link>
        <Link
          href="/profile/favorites"
          className="flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-full bg-[#BAE8E7] flex items-center justify-center">
            <HeartIcon filled className="text-primary" />
          </div>
          <span className="text-sm text-gray-700">관심목록</span>
        </Link>
      </div>

      {/* 나의 활동 섹션 */}
      <div className="mt-4">
        <h3 className="px-4 py-2 font-semibold text-gray-800">나의 활동</h3>
        <MenuItem icon={<ListIcon />} label="키워드 알림" href="/profile/keywords" />
        <MenuItem icon={<ListIcon />} label="모아보기" href="/profile/collection" />
        <MenuItem icon={<ListIcon />} label="거동숲 가계부" href="/profile/ledger" />
      </div>
    </MobileLayout>
  );
}
