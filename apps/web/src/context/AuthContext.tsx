'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { isWebView, requestNativeLogout } from '@/lib/nativeBridge';

// 사용자 정보 타입
interface User {
  id: string;
  email?: string;
  nickname?: string;
  profileImage?: string;
  islandName?: string;
  hemisphere?: 'NORTH' | 'SOUTH';
  dreamCode?: string;
  isProfileComplete?: boolean;
  mannerScore?: number;
}

// AuthContext 타입
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (accessToken: string, idToken?: string) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 토큰 갱신
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // HttpOnly 쿠키 전송
      });

      if (res.ok) {
        const data = await res.json();
        const newToken = data.accessToken;

        localStorage.setItem('accessToken', newToken);
        setAccessToken(newToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      return false;
    }
  }, []);

  // 인증 상태 확인
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setIsLoading(false);
      return;
    }

    setAccessToken(token);

    try {
      // 사용자 정보 조회 API (추후 구현 필요)
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else if (res.status === 401) {
        // 토큰 만료 시 갱신 시도
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          // 갱신 실패 시 로그아웃 처리
          localStorage.removeItem('accessToken');
          localStorage.removeItem('idToken');
          setAccessToken(null);
          setUser(null);
        }
      } else {
        // 기타 에러
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        setAccessToken(null);
      }
    } catch (error) {
      console.error('인증 확인 실패:', error);
      // 네트워크 에러 등 - 토큰은 유지하되 사용자 정보만 초기화
    }

    setIsLoading(false);
  }, [refreshAccessToken]);

  // 초기 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 사용자 정보 갱신 (프로필 수정 후 호출)
  // Before: 프로필 수정 후 user.isProfileComplete가 갱신되지 않아
  //         다음 수정 시 profile-setup API 호출 → "이미 프로필이 설정되어 있습니다" 에러
  // After: refreshUser()로 최신 사용자 정보를 다시 조회
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('사용자 정보 갱신 실패:', error);
    }
  }, []);

  // 로그인 처리
  const login = useCallback((newAccessToken: string, idToken?: string) => {
    localStorage.setItem('accessToken', newAccessToken);
    if (idToken) {
      localStorage.setItem('idToken', idToken);
    }
    setAccessToken(newAccessToken);

    // 사용자 정보 다시 조회
    checkAuth();
  }, [checkAuth]);

  // 로그아웃 처리
  // Before: isWebView 함수 중복 정의
  // After: nativeBridge.ts에서 import하여 사용
  const logout = useCallback(async () => {
    try {
      // 백엔드 로그아웃 API 호출 (쿠키 삭제)
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    }

    // 로컬 상태 정리
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    setAccessToken(null);
    setUser(null);

    // Before: WebView에서 홈으로 리다이렉트만 수행 → 네이티브 토큰 미제거로 로그인 상태 유지
    // After: 네이티브 앱에 로그아웃 요청 → 토큰 제거 후 로그인 화면으로 전환
    if (isWebView()) {
      requestNativeLogout();
      return;
    }

    // 브라우저 환경에서만 Cognito 로그아웃 수행
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = window.location.origin;

    if (cognitoDomain && clientId) {
      window.location.href = `https://${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    } else {
      // Cognito 설정이 없으면 홈으로 이동
      window.location.href = '/';
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!accessToken,
      accessToken,
      login,
      logout,
      refreshAccessToken,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
