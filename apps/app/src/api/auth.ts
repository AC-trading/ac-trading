// 인증 API 함수

import { apiRequest } from './client';
import { TokenResponse, SocialLoginRequest, User } from '../types/auth';

// 소셜 로그인 (Google/Kakao SDK 토큰으로 백엔드 인증)
export async function socialLogin(request: SocialLoginRequest): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/api/auth/social', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// 토큰 갱신
export async function refreshToken(): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/api/auth/refresh', {
    method: 'POST',
  });
}

// 로그아웃
export async function logout(): Promise<void> {
  await apiRequest('/api/auth/logout', {
    method: 'POST',
  });
}

// 현재 사용자 정보 조회
export async function getCurrentUser(token: string): Promise<User> {
  return apiRequest<User>('/api/users/me', {
    token,
  });
}
