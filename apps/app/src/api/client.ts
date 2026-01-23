// API 클라이언트 설정

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

interface RequestOptions extends RequestInit {
  token?: string;
}

// API 요청 함수
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  // Headers 인스턴스로 정규화하여 모든 헤더 타입 지원
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include', // 쿠키 포함 (refresh token)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API 요청 실패: ${response.status}`);
  }

  // 204 No Content 또는 빈 body 처리
  const contentLength = response.headers.get('Content-Length');
  if (response.status === 204 || contentLength === '0') {
    return {} as T;
  }

  return response.json();
}
