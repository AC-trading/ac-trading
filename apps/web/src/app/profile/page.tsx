"use client";

import Link from "next/link";
import Image from "next/image";
import { MobileLayout, Header } from "@/components/common";
import {
  SettingsIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
  HeartIcon,
} from "@/components/icons";
import { useAuth } from "@/context/AuthContext";

// 프로필 페이지 - Figma 디자인 기반
export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // 비로그인 상태
  if (!isLoading && !isAuthenticated) {
    return (
      <MobileLayout>
        <Header showLocation />
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
        <Header showLocation />
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
        showLocation
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
        <Image
          src={process.env.NEXT_PUBLIC_DEFAULT_PROFILE_IMAGE || "/images/defaults/raccoon.png"}
          alt="프로필 이미지"
          width={56}
          height={56}
          className="rounded-full object-cover"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-gray-900">{user?.nickname || "닉네임 없음"}</h2>
          <p className="text-sm text-gray-900">
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

      {/* 나의 무 가격 (매너 점수) - 당근마켓 스타일 */}
      <div className="mx-4 mt-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-1 mb-3">
          <span className="font-semibold text-gray-800">나의 무 가격</span>
          <span
            className="text-xs text-gray-400"
            aria-label="무 가격은 거래 매너를 나타내는 지표입니다"
            title="무 가격은 거래 매너를 나타내는 지표입니다"
          >
            ⓘ
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-red-500">
              {user?.mannerScore != null ? `${user.mannerScore.toFixed(1)}` : "-"}
            </span>
            <Image
              src={process.env.NEXT_PUBLIC_ICON_BASE ? `${process.env.NEXT_PUBLIC_ICON_BASE}/radish.png` : "/icons/radish.png"}
              alt="무 가격 아이콘"
              title="무 가격"
              width={40}
              height={40}
            />
          </div>
        </div>
        {/* 온도 바 */}
        {user?.mannerScore != null && (
          <div className="mt-3">
            <div className="w-full h-2 bg-[#FFFFF0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#BAE8E7] via-[#7ECEC5] to-[#5BBFB3] rounded-full"
                style={{ width: `${Math.min(Math.max(user.mannerScore, 0), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
