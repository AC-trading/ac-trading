// 모동숲 거래장터 앱 진입점

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LoginScreen, HomeScreen } from './src/screens';
import { getAccessToken, saveAccessToken, removeAccessToken } from './src/auth';
import { getCurrentUser, refreshToken } from './src/api/auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 앱 시작 시 로그인 상태 확인 및 토큰 유효성 검증
  async function checkAuthStatus() {
    try {
      const token = await getAccessToken();

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // 토큰 유효성 검증: 사용자 정보 조회 시도
      try {
        await getCurrentUser(token);
        setIsAuthenticated(true);
      } catch (error) {
        // 토큰이 만료/무효한 경우 갱신 시도
        console.log('토큰 검증 실패, 갱신 시도...');
        try {
          const tokenResponse = await refreshToken();
          await saveAccessToken(tokenResponse.accessToken);
          setIsAuthenticated(true);
        } catch (refreshError) {
          // 갱신도 실패하면 로그아웃 처리
          console.log('토큰 갱신 실패, 로그아웃 처리');
          await removeAccessToken();
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      await removeAccessToken();
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  // 로그인 성공 핸들러
  function handleLoginSuccess() {
    setIsAuthenticated(true);
  }

  // 로딩 중
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7ECEC5" />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isAuthenticated ? (
        <HomeScreen />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFF0',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
