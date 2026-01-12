// Cognito OAuth 인증 유틸리티

// Cognito OAuth URL 생성
export function getCognitoLoginUrl(provider?: "Google" | "Kakao") {
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId!,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
  });

  // 특정 소셜 로그인 제공자 지정
  if (provider) {
    params.set("identity_provider", provider);
  }

  return `https://${cognitoDomain}/oauth2/authorize?${params.toString()}`;
}

// Cognito 로그아웃 URL 생성
export function getCognitoLogoutUrl() {
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const logoutUri = window.location.origin;

  const params = new URLSearchParams({
    client_id: clientId!,
    logout_uri: logoutUri,
  });

  return `https://${cognitoDomain}/logout?${params.toString()}`;
}

// 임시 쿠키에서 토큰 읽고 localStorage로 이동
export function processAuthCookies() {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const accessToken = cookies["temp_access_token"];
  const idToken = cookies["temp_id_token"];
  const userInfo = cookies["temp_user_info"];

  if (accessToken) {
    // localStorage에 저장
    localStorage.setItem("access_token", accessToken);
    if (idToken) localStorage.setItem("id_token", idToken);
    if (userInfo) {
      try {
        const decoded = decodeURIComponent(userInfo);
        localStorage.setItem("user_info", decoded);
      } catch {
        // JSON 파싱 실패 무시
      }
    }

    // 임시 쿠키 삭제
    document.cookie = "temp_access_token=; path=/; max-age=0";
    document.cookie = "temp_id_token=; path=/; max-age=0";
    document.cookie = "temp_user_info=; path=/; max-age=0";

    return {
      accessToken,
      idToken,
      userInfo: userInfo ? JSON.parse(decodeURIComponent(userInfo)) : null,
    };
  }

  return null;
}

// 현재 인증 상태 확인
export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { isAuthenticated: false };
  }

  const accessToken = localStorage.getItem("access_token");
  const userInfoStr = localStorage.getItem("user_info");

  if (!accessToken) {
    return { isAuthenticated: false };
  }

  let userInfo: UserInfo | null = null;
  if (userInfoStr) {
    try {
      userInfo = JSON.parse(userInfoStr);
    } catch {
      // 파싱 실패
    }
  }

  return {
    isAuthenticated: true,
    accessToken,
    userInfo,
  };
}

// 로그아웃
export function logout() {
  if (typeof window === "undefined") return;

  // localStorage 정리
  localStorage.removeItem("access_token");
  localStorage.removeItem("id_token");
  localStorage.removeItem("user_info");

  // refresh_token 쿠키 삭제 요청 (서버에서 처리 필요)
  document.cookie = "refresh_token=; path=/; max-age=0";

  // Cognito 로그아웃으로 리다이렉트
  window.location.href = getCognitoLogoutUrl();
}

// 타입 정의
export interface UserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken?: string;
  userInfo?: UserInfo | null;
}
