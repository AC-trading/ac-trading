"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HomeOutlineIcon } from "@/components/icons";

// 프로필 수정 페이지 - Figma 디자인 기반 (회원가입 페이지와 동일 스타일)
export default function ProfileEditPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    islandName: "",
    name: "",
    hemisphere: "",
    dreamAddress: "",
  });
  const [isIslandNameValid, setIsIslandNameValid] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 섬 이름 유효성 검사
    if (name === "islandName") {
      setIsIslandNameValid(value.length >= 2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 호출로 프로필 업데이트
    console.log("프로필 수정:", formData);
    router.push("/profile");
  };

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
          <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-6xl border-4 border-white/50">
            🐰
          </div>
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
            {formData.islandName && (
              <p className={`text-sm mt-1 ${isIslandNameValid ? "text-green-200" : "text-red-200"}`}>
                * {isIslandNameValid ? "사용 가능한 아이디 입니다." : "2자 이상 입력해주세요."}
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

          {/* 반구 */}
          <div>
            <label className="block text-white font-medium mb-1">반구</label>
            <input
              type="text"
              name="hemisphere"
              value={formData.hemisphere}
              onChange={handleChange}
              placeholder="북반구 / 남반구"
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
          </div>

          {/* 꿈번지 */}
          <div>
            <label className="block text-white font-medium mb-1">꿈번지</label>
            <input
              type="text"
              name="dreamAddress"
              value={formData.dreamAddress}
              onChange={handleChange}
              placeholder="DA-0000-0000-0000"
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
          </div>

          {/* 수정 완료 버튼 */}
          <button
            type="submit"
            disabled={!isIslandNameValid || !formData.name}
            className="w-full py-3 rounded-lg bg-white text-primary font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            수정 완료
          </button>
        </form>
      </div>
    </div>
  );
}
