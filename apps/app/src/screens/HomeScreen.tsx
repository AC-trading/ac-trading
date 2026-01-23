// 홈 화면 (WebView로 웹앱 표시)

import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getAccessToken } from '../auth';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL;

if (!WEB_URL) {
  throw new Error('EXPO_PUBLIC_WEB_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

export default function HomeScreen() {
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7ECEC5" />
      </View>
    );
  }

  // WebView에 토큰 주입 스크립트 (JSON.stringify로 안전하게 이스케이프)
  const injectedJavaScript = token
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
        injectedJavaScript={injectedJavaScript}
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
});
