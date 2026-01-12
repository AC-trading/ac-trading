"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HomeOutlineIcon } from "@/components/icons";

// 로그인 페이지 - Figma 디자인 기반
export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 실제 로그인 로직 (Cognito OAuth)
    router.push("/");
  };

  const handleKakaoLogin = () => {
    // TODO: 카카오 OAuth 로그인
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* 홈 버튼 */}
      <div className="p-4">
        <Link href="/" className="inline-block text-white">
          <HomeOutlineIcon />
        </Link>
      </div>

      {/* 로고 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="mb-8 text-center">
          {/* 당근 아이콘 */}
          <div className="text-6xl mb-2">🥕</div>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "cursive" }}>
            당근이지
          </h1>
          <p className="text-white/80 mt-2 text-sm">이 것 좀 빌 려 줄 래 ?</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div>
            <input
              type="text"
              placeholder="아이디를 입력해주세요."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="비밀번호를 입력해주세요."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-transparent text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-white text-primary font-semibold hover:bg-gray-100 transition-colors"
          >
            로그인
          </button>

          {/* 카카오 로그인 버튼 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full py-3 rounded-lg bg-white text-primary font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded text-xs font-bold">
              TALK
            </span>
            <span>카카오 로그인</span>
          </button>

          {/* 회원가입 버튼 */}
          <Link
            href="/signup"
            className="w-full py-3 rounded-lg border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            회원가입
          </Link>
        </form>
      </div>
    </div>
  );
}
