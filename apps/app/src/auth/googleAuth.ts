// Google 로그인 (네이티브 SDK 사용)

import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';
import { socialLogin } from '../api/auth';
import { saveAccessToken } from './tokenStorage';

// Google Cloud Console에서 발급받은 웹 클라이언트 ID
// (ID 토큰 검증용 - 백엔드에서 사용)
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

// Google Sign-In 초기화
GoogleSignin.configure({
  // 웹 클라이언트 ID (ID 토큰 발급에 필요)
  webClientId: GOOGLE_WEB_CLIENT_ID,
  // 오프라인 액세스 토큰 요청
  offlineAccess: true,
  scopes: ['openid', 'email', 'profile'],
});

// Google 로그인 훅
export function useGoogleAuth(
  onSuccess?: () => void,
  onError?: (error: Error) => void,
  onCancel?: () => void
) {
  const [isReady, setIsReady] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function signIn() {
    if (isSigningIn) return;

    try {
      setIsSigningIn(true);

      // Google Play Services 확인
      await GoogleSignin.hasPlayServices();

      // Google 로그인 실행
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken } = response.data;

        if (!idToken) {
          throw new Error('Google ID 토큰을 받지 못했습니다.');
        }

        // 백엔드로 ID 토큰 전송하여 JWT 발급
        const tokenResponse = await socialLogin({
          provider: 'google',
          idToken,
        });

        // Access Token 저장
        await saveAccessToken(tokenResponse.accessToken);
        onSuccess?.();
      }
    } catch (error) {
      if (__DEV__) {
        console.log('Google signIn error:', error);
      }

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // 사용자가 취소한 경우 - 에러 표시 없이 취소 콜백 호출
            onCancel?.();
            break;
          case statusCodes.IN_PROGRESS:
            // 이미 로그인 진행 중 - 취소 콜백 호출
            onCancel?.();
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            onError?.(new Error('Google Play Services가 필요합니다.'));
            break;
          default:
            onError?.(new Error(error.message || 'Google 로그인 실패'));
        }
      } else {
        onError?.(error as Error);
      }
    } finally {
      setIsSigningIn(false);
    }
  }

  return {
    isReady,
    signIn,
  };
}

// Google 로그아웃
export async function signOutGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    if (__DEV__) {
      console.log('Google signOut error:', error);
    }
  }
}
