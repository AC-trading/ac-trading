// Kakao 로그인 (expo-auth-session 사용)

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { socialLogin } from '../api/auth';
import { saveAccessToken } from './tokenStorage';

WebBrowser.maybeCompleteAuthSession();

const KAKAO_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_APP_KEY;

// Kakao OAuth 엔드포인트
const discovery = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
  tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
};

// Kakao 로그인 함수
export async function signInWithKakao(
  onSuccess?: () => void,
  onError?: (error: Error) => void
) {
  if (!KAKAO_APP_KEY) {
    onError?.(new Error('Kakao App Key가 설정되지 않았습니다.'));
    return;
  }

  try {
    // Redirect URI 생성
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'acnh-trading',
    });

    // Authorization Code 요청
    const authRequest = new AuthSession.AuthRequest({
      clientId: KAKAO_APP_KEY,
      redirectUri,
      scopes: ['profile_nickname', 'account_email'],
      responseType: AuthSession.ResponseType.Code,
    });

    const result = await authRequest.promptAsync(discovery);

    if (result.type !== 'success' || !result.params.code) {
      if (result.type === 'cancel') {
        return; // 사용자가 취소한 경우
      }
      throw new Error('Kakao 인증 실패');
    }

    // Authorization Code로 Access Token 교환
    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId: KAKAO_APP_KEY,
        code: result.params.code,
        redirectUri,
      },
      discovery
    );

    if (!tokenResult.accessToken) {
      throw new Error('Kakao 토큰 교환 실패');
    }

    // 백엔드로 토큰 전송하여 JWT 발급
    const tokenResponse = await socialLogin({
      provider: 'kakao',
      accessToken: tokenResult.accessToken,
    });

    // Access Token 저장
    await saveAccessToken(tokenResponse.accessToken);
    onSuccess?.();
  } catch (error) {
    onError?.(error as Error);
  }
}
