"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { HomeOutlineIcon } from "@/components/icons";
import { getCognitoLoginUrl, processAuthCookies } from "@/lib/auth";

// 로그인 폼 컴포넌트 (searchParams 사용)
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // OAuth 콜백 후 토큰 처리 및 에러 메시지 표시
  useEffect(() => {
    // 임시 쿠키에서 토큰 처리
    const authResult = processAuthCookies();
    if (authResult) {
      router.push("/");
      return;
    }

    // URL에서 에러 파라미터 확인
    const errorParam = searchParams.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "no_code":
          setError("인증 코드를 받지 못했습니다.");
          break;
        case "callback_failed":
          setError("로그인 처리 중 오류가 발생했습니다.");
          break;
        default:
          setError(decodeURIComponent(errorParam));
      }
    }
  }, [searchParams, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Cognito 사용자 풀 직접 로그인 (이메일/비밀번호)
    // 현재는 OAuth 로그인만 지원
    setError("소셜 로그인을 이용해주세요.");
  };

  // 구글 로그인
  const handleGoogleLogin = () => {
    window.location.href = getCognitoLoginUrl("Google");
  };

  // 카카오 로그인
  const handleKakaoLogin = () => {
    window.location.href = getCognitoLoginUrl("Kakao");
  };

  return (
    <>
      {/* 에러 메시지 */}
      {error && (
        <div className="w-full max-w-sm mb-4 p-3 bg-red-500/20 border border-red-400 rounded-lg text-white text-sm text-center">
          {error}
        </div>
      )}

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

        {/* 소셜 로그인 구분선 */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/30" />
          <span className="text-white/60 text-sm">또는</span>
          <div className="flex-1 h-px bg-white/30" />
        </div>

        {/* 구글 로그인 버튼 */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-3 rounded-lg bg-white text-gray-700 font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Google로 로그인</span>
        </button>

        {/* 카카오 로그인 버튼 */}
        <button
          type="button"
          onClick={handleKakaoLogin}
          className="w-full py-3 rounded-lg bg-[#FEE500] text-[#000000D9] font-semibold hover:bg-[#FDD800] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000D9">
            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.68 6.73l-.95 3.53c-.08.31.27.56.54.38l4.18-2.78c.51.05 1.03.09 1.55.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
          </svg>
          <span>카카오로 로그인</span>
        </button>

        {/* 회원가입 버튼 */}
        <Link
          href="/signup"
          className="w-full py-3 rounded-lg border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors flex items-center justify-center"
        >
          회원가입
        </Link>
      </form>
    </>
  );
}

// 로그인 페이지 - Figma 디자인 기반
export default function LoginPage() {
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

        {/* Suspense로 감싸서 useSearchParams 사용 */}
        <Suspense
          fallback={
            <div className="w-full max-w-sm flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
