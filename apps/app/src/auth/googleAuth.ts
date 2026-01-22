// Google 로그인 (expo-auth-session 사용)

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { socialLogin } from '../api/auth';
import { saveAccessToken } from './tokenStorage';

// 웹 브라우저 리다이렉트 완료 처리
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Google 로그인 훅
export function useGoogleAuth(onSuccess?: () => void, onError?: (error: Error) => void) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['openid', 'email', 'profile'],
    // Expo Go에서 auth.expo.io 프록시 사용
    redirectUri: 'https://auth.expo.io/@mycindy0710/acnh-trading',
  });

  useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  async function handleGoogleResponse() {
    if (response?.type !== 'success') return;

    const { authentication } = response;
    if (!authentication?.accessToken) {
      onError?.(new Error('Google 인증 토큰을 받지 못했습니다.'));
      return;
    }

    try {
      // 백엔드로 토큰 전송하여 JWT 발급
      const tokenResponse = await socialLogin({
        provider: 'google',
        accessToken: authentication.accessToken,
        idToken: authentication.idToken,
      });

      // Access Token 저장
      await saveAccessToken(tokenResponse.accessToken);
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    }
  }

  return {
    // 로그인 가능 여부
    isReady: !!request,
    // 로그인 시작
    signIn: () => promptAsync(),
  };
}
