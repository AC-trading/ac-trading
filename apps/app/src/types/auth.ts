// 인증 관련 타입 정의

export interface User {
  uuid: string;
  email: string;
  nickname: string;
  islandName: string;
  hemisphere: string;
  mannerScore: number;
  isProfileComplete: boolean;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface SocialLoginRequest {
  provider: 'google' | 'kakao';
  accessToken?: string;  // Kakao용 (Google 네이티브 SDK는 accessToken 미제공)
  idToken?: string;      // Google용
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
