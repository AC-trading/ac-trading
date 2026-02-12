/**
 * 웹-네이티브 앱 통신 유틸리티
 * WebView 내에서 실행될 때 네이티브 앱과 통신하기 위한 함수들
 */

// 네이티브 앱 메시지 타입
type NativeMessageType = 'REQUEST_LOGIN' | 'REQUEST_LOGOUT';

interface NativeMessage {
  type: NativeMessageType;
  payload?: Record<string, unknown>;
}

// ReactNativeWebView 인터페이스 정의
interface ReactNativeWebView {
  postMessage: (message: string) => void;
}

// window 확장
declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebView;
  }
}

/**
 * WebView 환경인지 확인
 * - React Native WebView에서 실행 중인지 감지
 */
export function isWebView(): boolean {
  if (typeof window === 'undefined') return false;

  // React Native WebView가 주입한 객체 확인
  if (window.ReactNativeWebView !== undefined) return true;

  // User Agent 기반 감지 (fallback)
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('wv') || userAgent.includes('webview');
}

/**
 * 네이티브 앱에 메시지 전송
 * @param message 전송할 메시지
 * @returns 메시지 전송 성공 여부
 */
export function sendToNative(message: NativeMessage): boolean {
  if (!isWebView() || !window.ReactNativeWebView) {
    return false;
  }

  try {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error('네이티브 메시지 전송 실패:', error);
    return false;
  }
}

/**
 * 네이티브 로그인 요청
 * - WebView에서 로그인 버튼 클릭 시 네이티브 로그인 화면으로 이동 요청
 * @returns 요청 전송 성공 여부 (false면 일반 웹 로그인 사용)
 */
export function requestNativeLogin(): boolean {
  return sendToNative({ type: 'REQUEST_LOGIN' });
}

/**
 * 네이티브 로그아웃 요청
 * - WebView에서 로그아웃 시 네이티브 세션도 정리 요청
 * @returns 요청 전송 성공 여부
 */
export function requestNativeLogout(): boolean {
  return sendToNative({ type: 'REQUEST_LOGOUT' });
}
