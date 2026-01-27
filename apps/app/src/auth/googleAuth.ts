// Google 로그인 (네이티브 SDK 사용)

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { socialLogin } from '../api/auth';
import { saveAccessToken } from './tokenStorage';

// Google Sign-In 초기화 여부
let isConfigured = false;

// Google Sign-In 초기화 (지연 초기화 - 실제 사용 시점에 호출)
function ensureConfigured() {
  if (isConfigured) return;

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!webClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID 환경 변수가 설정되지 않았습니다.');
  }

  GoogleSignin.configure({
    webClientId: webClientId,
  });

  isConfigured = true;
}

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
      // 로그인 시도 전에 Google Sign-In 초기화
      // Before: try 블록 바깥에서 호출하여 에러가 onError로 전달되지 않음
      // After: try 블록 안에서 호출하여 모든 에러가 onError로 전달됨
      ensureConfigured();

      setIsSigningIn(true);

      // 기존 세션 정리 (새 토큰을 받기 위해)
      try {
        await GoogleSignin.signOut();
      } catch {
        // 무시
      }

      // Google Play Services 확인
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Google 로그인 실행 (v12 API)
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;

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
    } catch (error) {
      // v12 API: error.code로 직접 비교
      const errorCode = (error as { code?: string })?.code;

      if (errorCode === statusCodes.SIGN_IN_CANCELLED) {
        // 사용자가 취소한 경우 - 에러 표시 없이 취소 콜백 호출
        onCancel?.();
      } else if (errorCode === statusCodes.IN_PROGRESS) {
        // 이미 로그인 진행 중 - 취소 콜백 호출
        onCancel?.();
      } else if (errorCode === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError?.(new Error('Google Play Services가 필요합니다.'));
      } else {
        onError?.(error instanceof Error ? error : new Error('Google 로그인 실패'));
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
  } catch {
    // 로그아웃 실패 무시
  }
}
