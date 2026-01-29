// Kakao 로그인 (네이티브 SDK 사용)
// Before: expo-auth-session (웹 브라우저 OAuth)
// After: @react-native-seoul/kakao-login (네이티브 SDK) - 앱스토어 정책 충족

import { login, getProfile } from '@react-native-seoul/kakao-login';
import { socialLogin } from '../api/auth';
import { saveAccessToken } from './tokenStorage';

// Kakao 로그인 함수
export async function signInWithKakao(
  onSuccess?: () => void,
  onError?: (error: Error) => void,
  onCancel?: () => void
) {
  try {
    // 네이티브 Kakao SDK로 로그인
    const loginResult = await login();

    if (!loginResult.accessToken) {
      throw new Error('Kakao 로그인 실패: 토큰을 받지 못했습니다.');
    }

    // 백엔드로 토큰 전송하여 JWT 발급
    const tokenResponse = await socialLogin({
      provider: 'kakao',
      accessToken: loginResult.accessToken,
    });

    // Access Token 저장
    await saveAccessToken(tokenResponse.accessToken);
    onSuccess?.();
  } catch (error: any) {
    // 사용자가 취소한 경우
    if (error.message?.includes('cancelled') || error.message?.includes('cancel')) {
      onCancel?.();
      return;
    }
    onError?.(error as Error);
  }
}
