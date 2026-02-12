// 홈 화면 (WebView로 웹앱 표시)

import React, { useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, BackHandler, Platform } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { getAccessToken, removeAccessToken } from '../auth';

// WebView에서 전달받는 메시지 타입
interface NativeMessage {
  type: 'REQUEST_LOGIN' | 'REQUEST_LOGOUT';
  payload?: Record<string, unknown>;
}

interface HomeScreenProps {
  onLoginRequest: () => void;
  isProfileComplete: boolean;
}

export default function HomeScreen({ onLoginRequest, isProfileComplete }: HomeScreenProps) {
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [canGoBack, setCanGoBack] = React.useState(false);
  const webViewRef = useRef<WebView>(null);

  // 환경 변수를 컴포넌트 내부에서 가져옴 (Metro 연결 후 실행됨)
  const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL;

  React.useEffect(() => {
    loadToken();
  }, []);

  // Android 하드웨어 뒤로가기 버튼/제스처 처리
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // 이벤트 소비 (앱 종료 방지)
      }
      return false; // 기본 동작 (앱 종료)
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

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
        ref={webViewRef}
        source={{ uri: isProfileComplete ? WEB_URL : `${WEB_URL}/profile/setup` }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        onNavigationStateChange={(navState: WebViewNavigation) => {
          setCanGoBack(navState.canGoBack);
        }}
        onMessage={(event: WebViewMessageEvent) => {
          // 웹에서 앱으로 메시지 전달 처리
          try {
            const message: NativeMessage = JSON.parse(event.nativeEvent.data);
            if (__DEV__) console.log('Message from web:', message);

            switch (message.type) {
              case 'REQUEST_LOGIN':
                // WebView에서 로그인 요청 - 네이티브 로그인 화면으로 전환
                if (__DEV__) console.log('로그인 요청 수신, LoginScreen으로 전환');
                onLoginRequest();
                break;
              case 'REQUEST_LOGOUT':
                // WebView에서 로그아웃 요청 - 토큰 제거 후 로그인 화면으로
                if (__DEV__) console.log('로그아웃 요청 수신');
                removeAccessToken().then(() => onLoginRequest());
                break;
              default:
                if (__DEV__) console.log('알 수 없는 메시지 타입:', message.type);
            }
          } catch (error) {
            if (__DEV__) console.error('메시지 파싱 실패:', error);
          }
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
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
