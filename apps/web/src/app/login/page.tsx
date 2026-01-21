"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { HomeOutlineIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";

// Before: 프론트에서 Cognito로 직접 리다이렉트 - 백엔드 state 쿠키 미설정
// After: 백엔드 /api/auth/login/{provider}로 리다이렉트 - state 쿠키 설정됨
// 백엔드 OAuth 시작 URL 생성
function getBackendLoginUrl(provider: "google" | "kakao") {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // 환경 변수 검증
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.");
  }

  // trailing slash 제거하여 URL 정규화
  const cleanedApiUrl = apiUrl.replace(/\/+$/, "");

  return `${cleanedApiUrl}/api/auth/login/${provider}`;
}

// 로그인 폼 컴포넌트 (소셜 로그인만)
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // URL 에러 파라미터 확인
  const error = searchParams.get("error");
  const errorMessage = error ? getErrorMessage(error) : null;

  // 구글 로그인 - 백엔드로 리다이렉트하여 state 쿠키 설정
  const handleGoogleLogin = () => {
    window.location.href = getBackendLoginUrl("google");
  };

  // 카카오 로그인 - 백엔드로 리다이렉트하여 state 쿠키 설정
  const handleKakaoLogin = () => {
    window.location.href = getBackendLoginUrl("kakao");
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-sm flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      {/* 에러 메시지 */}
      {errorMessage && (
        <div className="w-full max-w-sm mb-4 p-3 bg-red-500/20 border border-red-400 rounded-lg text-white text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* 소셜 로그인 버튼들 */}
      <div className="w-full max-w-sm space-y-4">
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

        {/* 구분선 */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/30" />
          <span className="text-white/60 text-xs">간편하게 시작하세요</span>
          <div className="flex-1 h-px bg-white/30" />
        </div>

        {/* 비회원 둘러보기 */}
        <Link
          href="/"
          className="w-full py-3 rounded-lg border-2 border-white/50 text-white font-semibold hover:bg-white/10 transition-colors flex items-center justify-center"
        >
          둘러보기
        </Link>
      </div>
    </>
  );
}

// 에러 메시지 변환
function getErrorMessage(error: string): string {
  switch (error) {
    case "no_code":
      return "인증 코드를 받지 못했습니다.";
    case "callback_failed":
    case "auth_failed":
      return "로그인 처리 중 오류가 발생했습니다.";
    case "token_exchange_failed":
      return "토큰 교환에 실패했습니다.";
    default:
      return decodeURIComponent(error);
  }
}

// 로그인 페이지
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
          {/* 너굴 아이콘 */}
          <img
            src="/images/defaults/raccoon.png"
            alt="AC Trading"
            className="w-24 h-24 mx-auto mb-2 rounded-full"
          />
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "cursive" }}>
            AC Trading
          </h1>
          <p className="text-white/80 mt-2 text-sm">모여봐요 동물의 숲 아이템 거래</p>
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
