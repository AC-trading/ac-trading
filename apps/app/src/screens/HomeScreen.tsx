// 홈 화면 (WebView로 웹앱 표시)

import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { getAccessToken } from '../auth';

export default function HomeScreen() {
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // 환경 변수를 컴포넌트 내부에서 가져옴 (Metro 연결 후 실행됨)
  const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL;

  React.useEffect(() => {
    loadToken();
  }, []);

  async function loadToken() {
    try {
      const accessToken = await getAccessToken();
      setToken(accessToken);
    } catch (error) {
      console.error('토큰 로드 실패:', error);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  // 환경 변수가 없으면 에러 화면 표시
  if (!WEB_URL) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>환경 변수 오류</Text>
        <Text style={styles.errorDescription}>
          EXPO_PUBLIC_WEB_URL이 설정되지 않았습니다.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7ECEC5" />
      </View>
    );
  }

  // WebView에 토큰 주입 스크립트 (페이지 로드 전에 실행)
  // Before: injectedJavaScript - 페이지 로드 후 실행되어 웹앱이 먼저 로그인 체크함
  // After: injectedJavaScriptBeforeContentLoaded - 페이지 로드 전에 토큰 주입
  const injectedJavaScriptBeforeContentLoaded = token
    ? `
      localStorage.setItem('accessToken', ${JSON.stringify(token)});
      true;
    `
    : '';

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: WEB_URL }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        onMessage={(event) => {
          // 웹에서 앱으로 메시지 전달 처리
          console.log('Message from web:', event.nativeEvent.data);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7ECEC5" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFF0',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFF0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFF0',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 10,
  },
  errorDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
