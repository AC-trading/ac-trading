package com.acnh.api.auth.controller;

import com.acnh.api.auth.dto.CognitoTokenResponse;
import com.acnh.api.auth.dto.CognitoUserInfo;
import com.acnh.api.auth.dto.ErrorResponse;
import com.acnh.api.auth.dto.TokenResponse;
import com.acnh.api.auth.jwt.JwtTokenProvider;
import com.acnh.api.auth.service.CognitoAuthService;
import com.acnh.api.auth.util.CookieUtil;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * 인증 관련 API 컨트롤러
 * - /api/auth/callback: OAuth 콜백 (Cognito -> 토큰 교환 -> DB 동기화 -> 프론트 리다이렉트)
 * - /api/auth/refresh: Refresh Token으로 Access Token 갱신
 * - /api/auth/logout: 로그아웃 (쿠키 삭제)
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;
    private final CognitoAuthService cognitoAuthService;
    private final MemberRepository memberRepository;

    @Value("${frontend.url}")
    private String frontendUrl;

    /**
     * OAuth 콜백 핸들러
     * - Cognito에서 authorization code를 받아 토큰으로 교환
     * - DB에 사용자 생성/조회
     * - JWT 발급 후 프론트엔드로 리다이렉트
     */
    @GetMapping("/callback")
    public void handleOAuthCallback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "error_description", required = false) String errorDescription,
            HttpServletResponse response) throws IOException {

        // 에러 응답 처리 (사용자가 로그인 취소한 경우 등)
        if (error != null) {
            log.warn("OAuth 에러 발생: {} - {}", error, errorDescription);
            String errorUrl = frontendUrl + "/login?error=" + URLEncoder.encode(error, StandardCharsets.UTF_8);
            response.sendRedirect(errorUrl);
            return;
        }

        // code가 없는 경우
        if (code == null || code.isBlank()) {
            log.warn("Authorization code가 없습니다.");
            response.sendRedirect(frontendUrl + "/login?error=missing_code");
            return;
        }

        try {
            // 1. Cognito에서 토큰 교환
            CognitoTokenResponse cognitoTokens = cognitoAuthService.exchangeCodeForTokens(code);

            // 2. ID Token에서 사용자 정보 파싱
            CognitoUserInfo userInfo = cognitoAuthService.parseIdToken(cognitoTokens.getIdToken());

            // 3. DB에서 사용자 조회 또는 생성
            Member member = findOrCreateMember(userInfo);

            // 4. 자체 JWT 토큰 발급
            String accessToken = jwtTokenProvider.createAccessToken(
                    member.getUuid().toString(),
                    member.getEmail()
            );
            String refreshToken = jwtTokenProvider.createRefreshToken(member.getUuid().toString());

            // 5. Refresh Token을 HttpOnly 쿠키로 설정
            long maxAgeSeconds = jwtTokenProvider.getRefreshTokenValidity() / 1000;
            ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(refreshToken, maxAgeSeconds);
            cookieUtil.addCookie(response, refreshCookie);

            // 6. 프론트엔드 콜백 페이지로 리다이렉트 (Access Token은 URL 파라미터로)
            String redirectUrl = frontendUrl + "/auth/callback" +
                    "?accessToken=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8) +
                    "&idToken=" + URLEncoder.encode(cognitoTokens.getIdToken(), StandardCharsets.UTF_8);

            log.info("OAuth 로그인 성공 - userId: {}, provider: {}", member.getUuid(), userInfo.getProvider());
            response.sendRedirect(redirectUrl);

        } catch (Exception e) {
            log.error("OAuth 콜백 처리 실패: {}", e.getMessage(), e);
            String errorUrl = frontendUrl + "/login?error=" +
                    URLEncoder.encode("auth_failed", StandardCharsets.UTF_8);
            response.sendRedirect(errorUrl);
        }
    }

    /**
     * 사용자 조회 또는 생성
     * - cognitoSub로 기존 사용자 조회
     * - 없으면 새로 생성
     */
    private Member findOrCreateMember(CognitoUserInfo userInfo) {
        return memberRepository.findByCognitoSubAndDeletedAtIsNull(userInfo.getSub())
                .orElseGet(() -> {
                    // 새 사용자 생성
                    Member newMember = Member.builder()
                            .uuid(UUID.randomUUID())
                            .cognitoSub(userInfo.getSub())
                            .email(userInfo.getEmail())
                            .provider(userInfo.getProvider())
                            .providerId(userInfo.getProviderId())
                            .nickname(generateDefaultNickname())
                            .islandName("무인도")
                            .hemisphere("NORTH")
                            .mannerScore(100)
                            .totalTradeCount(0)
                            .build();

                    Member savedMember = memberRepository.save(newMember);
                    log.info("새 사용자 생성 - uuid: {}, email: {}", savedMember.getUuid(), savedMember.getEmail());
                    return savedMember;
                });
    }

    /**
     * 기본 닉네임 생성 (임시)
     */
    private String generateDefaultNickname() {
        return "섬주민" + System.currentTimeMillis() % 10000;
    }

    /**
     * Access Token 갱신
     * - HttpOnly 쿠키에서 Refresh Token 읽기
     * - 새로운 Access Token 발급
     * - 새로운 Refresh Token도 함께 갱신 (Sliding Session)
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request,
                                          HttpServletResponse response) {

        // 쿠키에서 Refresh Token 추출
        String refreshToken = cookieUtil.getRefreshTokenFromCookie(request)
                .orElse(null);

        // Refresh Token이 없는 경우
        if (refreshToken == null) {
            log.warn("Refresh Token이 쿠키에 없습니다.");
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.of(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "Refresh Token이 없습니다."
                    ));
        }

        // Refresh Token 유효성 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            log.warn("유효하지 않은 Refresh Token입니다.");
            // 무효한 토큰이면 쿠키 삭제
            ResponseCookie deleteCookie = cookieUtil.deleteRefreshTokenCookie();
            cookieUtil.addCookie(response, deleteCookie);

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.of(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "유효하지 않은 Refresh Token입니다."
                    ));
        }

        // Refresh Token 타입 확인
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            log.warn("Refresh Token 타입이 아닙니다.");
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.of(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "Refresh Token 타입이 아닙니다."
                    ));
        }

        // 사용자 정보 추출
        String userId = jwtTokenProvider.getUserId(refreshToken);

        // DB에서 사용자 조회하여 이메일 가져오기
        String email = memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(userId))
                .map(Member::getEmail)
                .orElse(null);

        // 새로운 Access Token 생성
        String newAccessToken = jwtTokenProvider.createAccessToken(userId, email);

        // 새로운 Refresh Token 생성 (Sliding Session)
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);

        // 새로운 Refresh Token을 HttpOnly 쿠키로 설정
        long maxAgeSeconds = jwtTokenProvider.getRefreshTokenValidity() / 1000;
        ResponseCookie newCookie = cookieUtil.createRefreshTokenCookie(newRefreshToken, maxAgeSeconds);
        cookieUtil.addCookie(response, newCookie);

        log.info("토큰 갱신 성공 - userId: {}", userId);

        // Access Token만 응답 바디로 반환
        return ResponseEntity.ok(TokenResponse.of(
                newAccessToken,
                jwtTokenProvider.getAccessTokenValidity()
        ));
    }

    /**
     * 로그아웃
     * - Refresh Token 쿠키 삭제
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {

        // Refresh Token 쿠키 삭제
        ResponseCookie deleteCookie = cookieUtil.deleteRefreshTokenCookie();
        cookieUtil.addCookie(response, deleteCookie);

        log.info("로그아웃 처리 완료");

        return ResponseEntity.ok().build();
    }

    /**
     * 헬스체크
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is healthy");
    }
}
