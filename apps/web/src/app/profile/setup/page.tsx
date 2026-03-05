"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

if (!process.env.NEXT_PUBLIC_API_URL) throw new Error('NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.');
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 신규 유저 프로필 설정 페이지 - /profile/edit 기반, 개인정보 이용 동의 추가
export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, accessToken, isLoading, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    islandName: "",
    islandSuffix: "섬" as "섬" | "도",
    name: "",
    hemisphere: "NORTH",
    dreamAddress: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로그인 확인
  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.push("/login");
    }
  }, [isLoading, accessToken, router]);

  // 이미 프로필 완성된 유저는 홈으로 리다이렉트
  useEffect(() => {
    if (!isLoading && user?.isProfileComplete) {
      router.push("/");
    }
  }, [isLoading, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 섬 이름 + 접미사(섬/도) 결합
      const trimmedName = formData.islandName.trim();
      const fullIslandName = trimmedName + formData.islandSuffix;

      if (!trimmedName) {
        setError("섬 이름을 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      if (!formData.name.trim()) {
        setError("이름을 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/users/me/profile-setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nickname: formData.name.trim(),
          islandName: fullIslandName,
          dreamAddress: formData.dreamAddress || null,
          hemisphere: formData.hemisphere,
        }),
      });

      if (res.ok) {
        // 프로필 정보 갱신 후 홈으로 이동
        await refreshUser();
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 - 프로필 설정 타이틀 */}
      <div className="p-4">
        <h1 className="text-lg font-bold text-gray-800">프로필 설정</h1>
        <p className="text-sm text-gray-500 mt-1">거래를 시작하기 전에 프로필을 설정해주세요</p>
      </div>

      {/* 프로필 설정 폼 */}
      <div className="flex-1 flex flex-col items-center px-8 pt-4">
        {/* 프로필 이미지 */}
        <div className="mb-4 flex flex-col items-center">
          <Image
            src={process.env.NEXT_PUBLIC_ICON_ISLAND || "/icons/island.png"}
            alt="프로필 이미지"
            width={112}
            height={112}
            className="rounded-full object-cover border-4 border-gray-200"
          />
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {/* 섬 이름 */}
          <div>
            <label className="block text-gray-800 font-medium mb-1">섬 이름</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="islandName"
                value={formData.islandName}
                onChange={handleChange}
                placeholder="섬 이름"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {/* 섬/도 선택 버튼 */}
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, islandSuffix: "섬" }))}
                  className={`px-4 py-3 rounded-l-lg text-sm font-medium border transition-colors ${
                    formData.islandSuffix === "섬"
                      ? "border-primary bg-primary/10 text-primary border-r-0"
                      : "border-gray-300 text-gray-700 hover:border-gray-400 border-r-0"
                  }`}
                >
                  섬
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, islandSuffix: "도" }))}
                  className={`px-4 py-3 rounded-r-lg text-sm font-medium border transition-colors ${
                    formData.islandSuffix === "도"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  도
                </button>
              </div>
            </div>
            {formData.islandName && (
              <p className="text-sm mt-1 text-gray-500">
                &quot;{formData.islandName}{formData.islandSuffix}&quot;(으)로 저장됩니다.
              </p>
            )}
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-gray-800 font-medium mb-1">이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs mt-1 text-gray-400">2~50자로 입력해주세요.</p>
          </div>

          {/* 반구 */}
          <div>
            <label className="block text-gray-800 font-medium mb-1">반구</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, hemisphere: "NORTH" }))}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  formData.hemisphere === "NORTH"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                북반구
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, hemisphere: "SOUTH" }))}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  formData.hemisphere === "SOUTH"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                남반구
              </button>
            </div>
          </div>

          {/* 꿈번지 */}
          <div>
            <label className="block text-gray-800 font-medium mb-1">꿈번지 (선택)</label>
            <input
              type="text"
              name="dreamAddress"
              value={formData.dreamAddress}
              onChange={handleChange}
              placeholder="DA-0000-0000-0000"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* 개인정보 이용 동의 */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">[필수]</span> 개인정보 수집 및 이용에 동의합니다.
                닉네임, 섬 이름 등 프로필 정보는 거래 서비스 제공을 위해 수집되며, 회원 탈퇴 시 삭제됩니다.
              </span>
            </label>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 시작하기 버튼 */}
          <button
            type="submit"
            disabled={!formData.islandName.trim() || formData.name.trim().length < 2 || !agreedToTerms || isSubmitting}
            className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isSubmitting ? "설정 중..." : "시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
