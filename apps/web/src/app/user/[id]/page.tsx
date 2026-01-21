"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MobileLayout, Header } from "@/components/common";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 유저 프로필 타입
interface UserProfile {
  id: string;
  nickname: string;
  islandName: string;
  dreamAddress?: string;
  hemisphere: string;
  mannerScore: number;
  totalTradeCount: number;
  reviewCount: number;
  createdAt: string;
  isProfileComplete: boolean;
}

// 다른 유저 프로필 조회 페이지
export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = params.id as string;

  // 유저 프로필 로드
  useEffect(() => {
    async function loadUserProfile() {
      if (!accessToken || !userId) return;

      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("유저를 찾을 수 없습니다");
          }
          throw new Error("유저 정보를 불러오는데 실패했습니다");
        }

        const data = await res.json();
        setUserProfile(data);
      } catch (err) {
        console.error("유저 프로필 로드 실패:", err);
        setError(err instanceof Error ? err.message : "유저 정보를 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadUserProfile();
    }
  }, [accessToken, userId, authLoading]);

  // 로딩 상태
  if (isLoading || authLoading) {
    return (
      <MobileLayout>
        <Header title="프로필" showBack onBack={() => router.back()} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </MobileLayout>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <MobileLayout>
        <Header title="프로필" showBack onBack={() => router.back()} />
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-6xl mb-4">😢</span>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
          >
            뒤로 가기
          </button>
        </div>
      </MobileLayout>
    );
  }

  // 유저 정보가 없는 경우
  if (!userProfile) {
    return (
      <MobileLayout>
        <Header title="프로필" showBack onBack={() => router.back()} />
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-6xl mb-4">🔍</span>
          <p className="text-sm">유저를 찾을 수 없습니다</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* 헤더 */}
      <Header title="프로필" showBack onBack={() => router.back()} />

      {/* 프로필 정보 */}
      <div className="flex items-center gap-4 p-4">
        {/* 프로필 이미지 */}
        <img
          src="/images/defaults/raccoon.png"
          alt="프로필 이미지"
          className="w-14 h-14 rounded-full object-cover"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-lg">{userProfile.nickname || "닉네임 없음"}</h2>
          <p className="text-sm text-gray-500">
            {userProfile.islandName || "섬 이름 없음"}
          </p>
        </div>
      </div>

      {/* 무 가격 (매너 점수) - 당근마켓 스타일 */}
      <div className="mx-4 mt-2 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-1 mb-3">
          <span className="font-semibold text-gray-800">무 가격</span>
          <span className="text-xs text-gray-400 cursor-pointer">ⓘ</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-red-500">
              {userProfile.mannerScore != null ? `${userProfile.mannerScore.toFixed(1)}` : "-"}
            </span>
            <img src="/icons/radish.png" alt="무" className="w-10 h-10" />
          </div>
        </div>
        {/* 온도 바 */}
        {userProfile.mannerScore != null && (
          <div className="mt-3">
            <div className="w-full h-2 bg-[#FFFFF0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#BAE8E7] via-[#7ECEC5] to-[#5BBFB3] rounded-full"
                style={{ width: `${Math.min(Math.max(userProfile.mannerScore, 0), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 거래 정보 */}
      <div className="mx-4 mt-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-xl font-bold text-gray-800">{userProfile.totalTradeCount || 0}</p>
            <p className="text-xs text-gray-500">거래 횟수</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-xl font-bold text-gray-800">{userProfile.reviewCount || 0}</p>
            <p className="text-xs text-gray-500">받은 리뷰</p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
