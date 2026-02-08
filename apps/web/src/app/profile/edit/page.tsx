"use client";

import Link from "next/link";
import Image from "next/image";
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
    islandSuffix: "섬" as "섬" | "도",
    name: "",
    hemisphere: "NORTH",
    dreamAddress: "",
  });
  const [isIslandNameValid, setIsIslandNameValid] = useState(false);
  // 섬/도 선택 버튼은 항상 표시
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 기존 프로필 정보 불러오기
  useEffect(() => {
    if (user) {
      // 섬 이름에서 접미사(섬/도) 분리
      let baseName = user.islandName || "";
      let suffix: "섬" | "도" = "섬";

      if (baseName.endsWith("도")) {
        suffix = "도";
        baseName = baseName.slice(0, -1);
      } else if (baseName.endsWith("섬")) {
        suffix = "섬";
        baseName = baseName.slice(0, -1);
      }

      setFormData({
        islandName: baseName,
        islandSuffix: suffix,
        name: user.nickname || "",
        hemisphere: user.hemisphere || "NORTH",
        dreamAddress: user.dreamCode || "",
      });
      setIsIslandNameValid(baseName.length >= 1);
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

    // 섬 이름 유효성 검사 (접미사 제외 1자 이상)
    if (name === "islandName") {
      setIsIslandNameValid(value.length >= 1);
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

      // 섬 이름 + 접미사(섬/도) 결합
      // 특수문자( " #@& 등) 포함 가능 - trim만 적용
      const trimmedName = formData.islandName.trim();
      const fullIslandName = trimmedName + formData.islandSuffix;

      if (!trimmedName) {
        setError("섬 이름을 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          nickname: formData.name.trim(),
          islandName: fullIslandName,
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 홈 버튼 */}
      <div className="p-4">
        <Link href="/profile" className="inline-block text-gray-800">
          <HomeOutlineIcon />
        </Link>
      </div>

      {/* 프로필 수정 폼 */}
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
          {/* 섬 이름 - 특수문자( " #@& 등) 포함 가능, 별도 필터링 없음 */}
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
            {/* CodeRabbit 리뷰 반영: dead code 제거
               Before: formData.islandName && !isIslandNameValid 조건은
               isIslandNameValid가 length >= 1로 설정되어 절대 true가 될 수 없었음 */}
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
          </div>

          {/* 반구 - 신규 유저만 수정 가능 */}
          <div>
            <label className="block text-gray-800 font-medium mb-1">반구</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => !user?.isProfileComplete && setFormData((prev) => ({ ...prev, hemisphere: "NORTH" }))}
                disabled={user?.isProfileComplete}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  formData.hemisphere === "NORTH"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                북반구
              </button>
              <button
                type="button"
                onClick={() => !user?.isProfileComplete && setFormData((prev) => ({ ...prev, hemisphere: "SOUTH" }))}
                disabled={user?.isProfileComplete}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                  formData.hemisphere === "SOUTH"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                남반구
              </button>
            </div>
            {user?.isProfileComplete && (
              <p className="text-sm mt-1 text-gray-500">* 반구는 변경할 수 없습니다.</p>
            )}
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

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={!isIslandNameValid || !formData.name || isSubmitting}
            className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isSubmitting ? "저장 중..." : user?.isProfileComplete ? "수정 완료" : "프로필 설정 완료"}
          </button>
        </form>
      </div>
    </div>
  );
}
