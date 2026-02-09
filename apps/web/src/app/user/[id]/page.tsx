"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { MobileLayout, Header } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { getMannerScoreColor } from "@/lib/mannerScore";

// API URL 검증 - 개발 환경에서만 localhost 폴백 허용
const API_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:8080";
    }
    throw new Error("NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.");
  }
  return url;
})();

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

  // params.id가 string[] 일 수 있으므로 처리
  const rawId = params.id;
  const userId = Array.isArray(rawId) ? rawId[0] : rawId;

  // userId가 없으면 404
  if (!userId) {
    notFound();
  }

  // 유저 프로필 로드
  useEffect(() => {
    async function loadUserProfile() {
      // 인증 토큰이 없으면 로그인 페이지로 리다이렉트
      if (!accessToken) {
        router.push("/login");
        return;
      }

      // userId가 없으면 로딩 종료 (notFound에서 처리됨)
      if (!userId) {
        setIsLoading(false);
        return;
      }

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
  }, [accessToken, userId, authLoading, router]);

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
        <Image
          src={process.env.NEXT_PUBLIC_ICON_ISLAND || "/icons/island.png"}
          alt="프로필 이미지"
          width={56}
          height={56}
          className="rounded-full object-cover"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-[#5BBFB3]">{userProfile.nickname || "닉네임 없음"}</h2>
          <p className="text-sm text-gray-500">
            {userProfile.islandName || "섬 이름 없음"}
          </p>
        </div>
      </div>

      {/* 무 점수 (매너 점수) - 당근마켓 스타일 */}
      <div className="mx-4 mt-2 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-1 mb-3">
          <span className="font-semibold text-gray-800">무 점수</span>
          <span
            className="text-xs text-gray-400"
            aria-label="무 점수는 거래 매너를 나타내는 지표입니다"
            title="무 점수는 거래 매너를 나타내는 지표입니다"
          >
            ⓘ
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="text-3xl font-bold"
              style={{ color: userProfile.mannerScore != null && Number.isFinite(userProfile.mannerScore) ? getMannerScoreColor(userProfile.mannerScore) : "#adb5bd" }}
            >
              {userProfile.mannerScore != null && Number.isFinite(userProfile.mannerScore) ? `${userProfile.mannerScore.toFixed(1)} 벨` : "-"}
            </span>
            <Image
              src={process.env.NEXT_PUBLIC_ICON_CARROT || "/icons/carrot.svg"}
              alt="무 아이콘"
              title="무 점수"
              width={40}
              height={40}
            />
          </div>
        </div>
        {/* 온도 바 */}
        {userProfile.mannerScore != null && Number.isFinite(userProfile.mannerScore) && (
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
