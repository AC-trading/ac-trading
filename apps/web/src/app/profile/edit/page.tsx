"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { HomeOutlineIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 프로필 수정 페이지 - Figma 디자인 기반 (회원가입 페이지와 동일 스타일)
export default function ProfileEditPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    islandName: "",
    name: "",
    hemisphere: "NORTH",
    dreamAddress: "",
  });
  const [isIslandNameValid, setIsIslandNameValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 기존 프로필 정보 불러오기
  useEffect(() => {
    if (user) {
      setFormData({
        islandName: user.islandName || "",
        name: user.nickname || "",
        hemisphere: user.hemisphere || "NORTH",
        dreamAddress: user.dreamCode || "",
      });
      setIsIslandNameValid((user.islandName?.length || 0) >= 2);
    }
  }, [user]);

  // 로그인 확인
  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.push("/login");
    }
  }, [isLoading, accessToken, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 섬 이름 유효성 검사
    if (name === "islandName") {
      setIsIslandNameValid(value.length >= 2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 신규 유저(프로필 미완성)는 profile-setup, 기존 유저는 update API 호출
      const isNewUser = !user?.isProfileComplete;
      const endpoint = isNewUser ? "/api/users/me/profile-setup" : "/api/users/me/update";

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nickname: formData.name,
          islandName: formData.islandName,
          dreamAddress: formData.dreamAddress || null,
          ...(isNewUser && { hemisphere: formData.hemisphere }),
        }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const errorData = await res.json().catch(() => null);
        setError(errorData?.message || "프로필 저장에 실패했습니다.");
      }
    } catch (err) {
      console.error("프로필 저장 실패:", err);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* 홈 버튼 */}
      <div className="p-4">
        <Link href="/profile" className="inline-block text-white">
          <HomeOutlineIcon />
        </Link>
      </div>

      {/* 프로필 수정 폼 */}
      <div className="flex-1 flex flex-col items-center px-8 pt-4">
        {/* 프로필 이미지 */}
        <div className="mb-4">
          <img
            src={user?.profileImage || "/images/defaults/raccoon.png"}
            alt="프로필 이미지"
            className="w-28 h-28 rounded-full object-cover border-4 border-white/50"
          />
          <button className="mt-2 px-4 py-1 bg-white/20 text-white text-sm rounded-full hover:bg-white/30 transition-colors">
            사진 수정
          </button>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {/* 섬 이름 */}
          <div>
            <label className="block text-white font-medium mb-1">섬 이름</label>
            <input
              type="text"
              name="islandName"
              value={formData.islandName}
              onChange={handleChange}
              placeholder="섬 이름을 입력하세요"
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
            {formData.islandName && !isIslandNameValid && (
              <p className="text-sm mt-1 text-red-200">
                * 2자 이상 입력해주세요.
              </p>
            )}
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-white font-medium mb-1">이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
          </div>

          {/* 반구 - 신규 유저만 수정 가능 */}
          <div>
            <label className="block text-white font-medium mb-1">반구</label>
            <select
              name="hemisphere"
              value={formData.hemisphere}
              onChange={handleChange}
              disabled={user?.isProfileComplete}
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white focus:outline-none focus:border-white disabled:opacity-50"
            >
              <option value="NORTH" className="text-gray-900">북반구</option>
              <option value="SOUTH" className="text-gray-900">남반구</option>
            </select>
            {user?.isProfileComplete && (
              <p className="text-sm mt-1 text-white/70">* 반구는 변경할 수 없습니다.</p>
            )}
          </div>

          {/* 꿈번지 */}
          <div>
            <label className="block text-white font-medium mb-1">꿈번지 (선택)</label>
            <input
              type="text"
              name="dreamAddress"
              value={formData.dreamAddress}
              onChange={handleChange}
              placeholder="DA-0000-0000-0000"
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-300/50">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={!isIslandNameValid || !formData.name || isSubmitting}
            className="w-full py-3 rounded-lg bg-white text-primary font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isSubmitting ? "저장 중..." : user?.isProfileComplete ? "수정 완료" : "프로필 설정 완료"}
          </button>
        </form>
      </div>
    </div>
  );
}
