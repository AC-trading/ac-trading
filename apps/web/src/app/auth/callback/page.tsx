'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// 콜백 처리 컴포넌트
function CallbackHandler() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    // Before: searchParams(쿼리 파라미터)에서 토큰 추출 - 서버 로그에 노출 위험
    // After: URL Fragment(#)에서 토큰 추출 - 서버로 전송되지 않아 보안 강화
    // URL Fragment에서 토큰 추출 (백엔드에서 리다이렉트 시 전달)
    const hash = window.location.hash.substring(1); // '#' 제거
    const params = new URLSearchParams(hash);

    const accessToken = params.get('accessToken');
    const idToken = params.get('idToken');

    // 쿼리 파라미터에서 에러 확인 (에러는 쿼리로 전달됨)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      // 에러 발생 시 로그인 페이지로 리다이렉트
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (accessToken) {
      // 토큰 저장 및 로그인 처리
      login(accessToken, idToken || undefined);
      router.push('/');
    } else {
      // 토큰이 없는 경우
      router.push('/login?error=auth_failed');
    }
  }, [login, router]);

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🥕</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">로그인 처리 중...</p>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🥕</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">로딩 중...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
