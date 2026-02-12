// 로그인 화면
// Before: 민트 배경 (#7ECEC5)
// After: 흰색 배경 (#FFFFFF) + StatusBar 설정

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useGoogleAuth, signInWithKakao } from '../auth';

// Before: raccoon.png 사용 (저작권 이슈)
// After: 커스텀 민트색 로고 컴포넌트로 교체 (react-native-svg 미설치로 SVG 사용 불가)

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Google 로그인 훅
  const { isReady: isGoogleReady, signIn: signInWithGoogle } = useGoogleAuth(
    () => {
      setIsLoading(false);
      onLoginSuccess();
    },
    (error) => {
      setIsLoading(false);
      Alert.alert('로그인 실패', error.message);
    },
    () => {
      // 사용자가 취소한 경우 - 로딩 상태만 해제
      setIsLoading(false);
    }
  );

  // Google 로그인 버튼 핸들러
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signInWithGoogle();
  };

  // Kakao 로그인 버튼 핸들러
  const handleKakaoLogin = async () => {
    setIsLoading(true);
    await signInWithKakao(
      () => {
        setIsLoading(false);
        onLoginSuccess();
      },
      (error) => {
        setIsLoading(false);
        Alert.alert('로그인 실패', error.message);
      },
      () => {
        // 사용자가 취소한 경우 - 로딩 상태만 해제
        setIsLoading(false);
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* 상태바 설정 - 흰색 배경에 어두운 아이콘 */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {/* 로고 영역 */}
      <View style={styles.header}>
        {/* 커스텀 민트색 로고 - 저작권 안전 */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>AC</Text>
        </View>
        <Text style={styles.title}>AC Trading</Text>
        <Text style={styles.subtitle}>모여봐요 동물의 숲 아이템 거래</Text>
      </View>

      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#7ECEC5" />
        ) : (
          <>
            {/* Google 로그인 버튼 */}
            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleLogin}
              disabled={!isGoogleReady}
            >
              <View style={styles.buttonContent}>
                {/* Google 아이콘 */}
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Google로 로그인</Text>
              </View>
            </TouchableOpacity>

            {/* Kakao 로그인 버튼 */}
            <TouchableOpacity
              style={[styles.button, styles.kakaoButton]}
              onPress={handleKakaoLogin}
            >
              <View style={styles.buttonContent}>
                {/* Kakao 아이콘 */}
                <View style={styles.kakaoIcon}>
                  <View style={styles.kakaoIconBubble} />
                </View>
                <Text style={styles.kakaoButtonText}>카카오로 로그인</Text>
              </View>
            </TouchableOpacity>

            {/* 구분선 */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>간편하게 시작하세요</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 흰색 배경
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
    backgroundColor: '#7ECEC5',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#7ECEC5', // 민트색 타이틀
    fontStyle: 'italic', // cursive 대체
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButton: {
    backgroundColor: '#fff',
    // 그림자 효과 (iOS + Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#374151', // gray-700
    fontSize: 16,
    fontWeight: '600',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    // 그림자 효과 (iOS + Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kakaoIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoIconBubble: {
    width: 16,
    height: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 6,
  },
  kakaoButtonText: {
    color: 'rgba(0, 0, 0, 0.85)', // #000000D9
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    color: '#999',
    fontSize: 12,
  },
});
