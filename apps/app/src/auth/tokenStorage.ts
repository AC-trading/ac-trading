// 토큰 저장소 (SecureStore 사용)

import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';

// Access Token 저장
export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

// Access Token 조회
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

// Access Token 삭제
export async function removeAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
