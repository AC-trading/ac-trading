"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HomeOutlineIcon } from "@/components/icons";

// 회원가입 페이지 - Figma 디자인 기반
export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    password: "",
    passwordConfirm: "",
  });
  const [isIdValid, setIsIdValid] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 아이디 유효성 검사 (간단한 예시)
    if (name === "userId") {
      setIsIdValid(value.length >= 4);
    }

    // 비밀번호 일치 확인
    if (name === "password" || name === "passwordConfirm") {
      const pw = name === "password" ? value : formData.password;
      const pwConfirm = name === "passwordConfirm" ? value : formData.passwordConfirm;
      setIsPasswordMatch(pw === pwConfirm && pw.length > 0);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 실제 회원가입 로직
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* 홈 버튼 */}
      <div className="p-4">
        <Link href="/" className="inline-block text-white">
          <HomeOutlineIcon />
        </Link>
      </div>

      {/* 회원가입 폼 */}
      <div className="flex-1 flex flex-col items-center px-8 pt-4">
        {/* 프로필 이미지 선택 */}
        <div className="mb-4">
          <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-6xl border-4 border-white/50">
            🐰
          </div>
          <button className="mt-2 px-4 py-1 bg-white/20 text-white text-sm rounded-full hover:bg-white/30 transition-colors">
            사진 수정
          </button>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSignup} className="w-full max-w-sm space-y-4">
          {/* 아이디 */}
          <div>
            <label className="block text-white font-medium mb-1">아이디</label>
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
            {formData.userId && (
              <p className={`text-sm mt-1 ${isIdValid ? "text-green-200" : "text-red-200"}`}>
                * {isIdValid ? "사용 가능한 아이디 입니다." : "4자 이상 입력해주세요."}
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
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-white font-medium mb-1">비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-white font-medium mb-1">비밀번호 확인</label>
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
            {formData.passwordConfirm && (
              <p className={`text-sm mt-1 ${isPasswordMatch ? "text-green-200" : "text-red-200"}`}>
                * {isPasswordMatch ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
              </p>
            )}
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={!isIdValid || !isPasswordMatch || !formData.name}
            className="w-full py-3 rounded-lg bg-white text-primary font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}
