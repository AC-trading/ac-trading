import { NextRequest, NextResponse } from "next/server";

// Cognito OAuth 콜백 처리
// Cognito가 인가 코드(authorization code)와 함께 이 엔드포인트로 리다이렉트함
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // 에러 처리
  if (error) {
    console.error("OAuth 에러:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // 인가 코드 없음
  if (!code) {
    console.error("인가 코드 없음");
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    // Cognito 토큰 엔드포인트로 인가 코드를 토큰으로 교환
    const tokenResponse = await exchangeCodeForTokens(code, request.url);

    if (!tokenResponse.access_token) {
      throw new Error("토큰 교환 실패");
    }

    // 사용자 정보 가져오기
    const userInfo = await getUserInfo(tokenResponse.access_token);

    // 응답 생성 - 홈으로 리다이렉트
    const response = NextResponse.redirect(new URL("/", request.url));

    // access_token은 클라이언트에서 localStorage로 저장하도록 쿠키로 임시 전달
    // (클라이언트에서 읽고 localStorage로 이동 후 삭제)
    response.cookies.set("temp_access_token", tokenResponse.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 1분간 유효 (클라이언트가 읽고 삭제할 시간)
      path: "/",
    });

    // id_token도 전달 (사용자 정보 포함)
    if (tokenResponse.id_token) {
      response.cookies.set("temp_id_token", tokenResponse.id_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60,
        path: "/",
      });
    }

    // refresh_token은 HttpOnly 쿠키로 안전하게 저장
    if (tokenResponse.refresh_token) {
      response.cookies.set("refresh_token", tokenResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30일
        path: "/",
      });
    }

    // 사용자 정보도 임시 쿠키로 전달
    response.cookies.set("temp_user_info", JSON.stringify(userInfo), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("OAuth 콜백 처리 실패:", err);
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", request.url)
    );
  }
}

// Cognito 토큰 엔드포인트 호출
async function exchangeCodeForTokens(code: string, requestUrl: string) {
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  // 콜백 URL 구성 (현재 요청 URL에서 추출)
  const url = new URL(requestUrl);
  const redirectUri = `${url.origin}/api/auth/callback`;

  const tokenUrl = `https://${cognitoDomain}/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId!,
    code: code,
    redirect_uri: redirectUri,
  });

  const headers: HeadersInit = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // client_secret이 있으면 Basic Auth 사용
  if (clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("토큰 교환 실패:", response.status, errorText);
    throw new Error(`토큰 교환 실패: ${response.status}`);
  }

  return response.json() as Promise<CognitoTokenResponse>;
}

// Cognito userInfo 엔드포인트 호출
async function getUserInfo(accessToken: string) {
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const userInfoUrl = `https://${cognitoDomain}/oauth2/userInfo`;

  const response = await fetch(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("사용자 정보 조회 실패:", response.status, errorText);
    throw new Error(`사용자 정보 조회 실패: ${response.status}`);
  }

  return response.json() as Promise<CognitoUserInfo>;
}

// 타입 정의
interface CognitoTokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

interface CognitoUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  identities?: string; // 소셜 로그인 정보 (JSON 문자열)
}
