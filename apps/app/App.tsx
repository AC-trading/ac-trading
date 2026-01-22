// 모동숲 거래장터 앱 진입점

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LoginScreen, HomeScreen } from './src/screens';
import { getAccessToken } from './src/auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 앱 시작 시 로그인 상태 확인
  async function checkAuthStatus() {
    try {
      const token = await getAccessToken();
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
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
