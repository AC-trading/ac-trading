// 로그인 화면

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useGoogleAuth, signInWithKakao } from '../auth';

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
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏝️ 모동숲 거래장터</Text>
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
              <Text style={styles.googleButtonText}>Google로 시작하기</Text>
            </TouchableOpacity>

            {/* Kakao 로그인 버튼 */}
            <TouchableOpacity
              style={[styles.button, styles.kakaoButton]}
              onPress={handleKakaoLogin}
            >
              <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFF0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  kakaoButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
