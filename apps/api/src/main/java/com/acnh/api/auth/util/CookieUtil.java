package com.acnh.api.auth.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

/**
 * 쿠키 유틸리티 클래스
 * OWASP 권장 보안 설정 적용:
 * - HttpOnly: XSS 방어 (JS 접근 차단)
 * - SameSite=Lax: CSRF 방어 (OAuth 리다이렉트 허용)
 * - Path=/api/auth: 불필요한 쿠키 전송 방지
 * - Secure: 프로덕션에서 HTTPS만 허용
 */
@Component
public class CookieUtil {

    public static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    public static final String OAUTH_STATE_COOKIE_NAME = "oauth_state";
    private static final String COOKIE_PATH = "/api/auth";
    // Before: state 쿠키 없음
    // After: OAuth CSRF 방어를 위한 state 쿠키 추가 (5분 TTL)

    @Value("${cookie.secure:false}")
    private boolean secureCookie;

    /**
     * Refresh Token 쿠키 생성
     * - HttpOnly: true (JS 접근 차단)
     * - SameSite: Lax (OAuth 리다이렉트 허용)
     * - Path: /api/auth (필요한 경로에서만 전송)
     * - Secure: 환경변수로 제어 (프로덕션: true)
     */
    public ResponseCookie createRefreshTokenCookie(String refreshToken, long maxAgeSeconds) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .httpOnly(true)           // XSS 방어
                .secure(secureCookie)     // 프로덕션에서 true
                .sameSite("Lax")          // CSRF 방어 (OAuth 허용)
                .path(COOKIE_PATH)        // /api/auth 경로에서만 전송
                .maxAge(maxAgeSeconds)
                .build();
    }

    /**
     * Refresh Token 쿠키 삭제 (로그아웃 시)
     */
    public ResponseCookie deleteRefreshTokenCookie() {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path(COOKIE_PATH)
                .maxAge(0)  // 즉시 만료
                .build();
    }

    /**
     * 요청에서 Refresh Token 쿠키 추출
     */
    public Optional<String> getRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }

        return Arrays.stream(cookies)
                .filter(cookie -> REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    /**
     * 응답에 쿠키 추가
     */
    public void addCookie(HttpServletResponse response, ResponseCookie cookie) {
        response.addHeader("Set-Cookie", cookie.toString());
    }

    /**
     * OAuth State 쿠키 생성 (CSRF 방어용)
     * - HttpOnly: true (JS 접근 차단)
     * - SameSite: None (크로스 도메인 OAuth 허용)
     * - Secure: true (SameSite=None 필수 조건)
     * - maxAge: 5분 (OAuth 플로우 완료 시간)
     */
    public ResponseCookie createOAuthStateCookie(String state) {
        return ResponseCookie.from(OAUTH_STATE_COOKIE_NAME, state)
                .httpOnly(true)
                .secure(true)           // SameSite=None 필수
                .sameSite("None")       // 크로스 도메인 허용
                .path(COOKIE_PATH)
                .maxAge(300)  // 5분
                .build();
    }

    /**
     * OAuth State 쿠키 삭제
     */
    public ResponseCookie deleteOAuthStateCookie() {
        return ResponseCookie.from(OAUTH_STATE_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)           // SameSite=None 필수
                .sameSite("None")       // 크로스 도메인 허용
                .path(COOKIE_PATH)
                .maxAge(0)
                .build();
    }

    /**
     * 요청에서 OAuth State 쿠키 추출
     */
    public Optional<String> getOAuthStateFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }

        return Arrays.stream(cookies)
                .filter(cookie -> OAUTH_STATE_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }
}
