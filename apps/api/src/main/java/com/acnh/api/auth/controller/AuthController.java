package com.acnh.api.auth.controller;

import com.acnh.api.auth.dto.CognitoTokenResponse;
import com.acnh.api.auth.dto.CognitoUserInfo;
import com.acnh.api.auth.dto.ErrorResponse;
import com.acnh.api.auth.dto.SocialLoginRequest;
import com.acnh.api.auth.dto.SocialUserInfo;
import com.acnh.api.auth.dto.TokenResponse;
import com.acnh.api.auth.jwt.JwtTokenProvider;
import com.acnh.api.auth.service.CognitoAuthService;
import com.acnh.api.auth.service.SocialAuthService;
import com.acnh.api.auth.util.CookieUtil;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
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
import java.util.Set;
import java.util.UUID;

/**
 * 인증 관련 API 컨트롤러
 * - GET  /api/auth/login/{provider}: 소셜 로그인 시작 (Google/Kakao)
 * - GET  /api/auth/callback/{provider}: 소셜 로그인 콜백 처리
 * - POST /api/auth/refresh: Access Token 갱신
 * - POST /api/auth/logout: 로그아웃 및 토큰 무효화
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Set<String> SUPPORTED_PROVIDERS = Set.of("google", "kakao");

    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;
    private final CognitoAuthService cognitoAuthService;
    private final SocialAuthService socialAuthService;
    private final MemberRepository memberRepository;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${cognito.domain}")
    private String cognitoDomain;

    @Value("${cognito.client-id}")
    private String cognitoClientId;

    @Value("${cognito.redirect-uri-base:#{null}}")
    private String redirectUriBase;

    @Value("${cognito.redirect-uri}")
    private String defaultRedirectUri;

    /**
     * 소셜 로그인 시작
     * - Cognito Hosted UI로 리다이렉트
     * - provider: google 또는 kakao
     */
    @GetMapping("/login/{provider}")
    public void startSocialLogin(
            @PathVariable String provider,
            HttpServletResponse response) throws IOException {

        String normalizedProvider = provider.toLowerCase();

        // 지원하지 않는 provider 체크
        if (!SUPPORTED_PROVIDERS.contains(normalizedProvider)) {
            log.warn("지원하지 않는 OAuth provider: {}", provider);
            response.sendRedirect(frontendUrl + "/login?error=unsupported_provider");
            return;
        }

        // Cognito identity_provider 이름 매핑 (첫 글자 대문자)
        String identityProvider = normalizedProvider.substring(0, 1).toUpperCase()
                + normalizedProvider.substring(1);

        // provider별 redirect URI 생성
        String redirectUri = getRedirectUri(normalizedProvider);

        // Before: state 파라미터 없음
        // After: CSRF 방어를 위한 state 파라미터 추가
        // 랜덤 state 생성 및 쿠키에 저장
        String state = UUID.randomUUID().toString();
        ResponseCookie stateCookie = cookieUtil.createOAuthStateCookie(state);
        cookieUtil.addCookie(response, stateCookie);

        // Cognito OAuth authorize URL 생성 (state 파라미터 포함)
        String authorizeUrl = String.format(
                "https://%s/oauth2/authorize?client_id=%s&response_type=code&scope=openid+email+profile&redirect_uri=%s&identity_provider=%s&state=%s",
                cognitoDomain,
                cognitoClientId,
                URLEncoder.encode(redirectUri, StandardCharsets.UTF_8),
                identityProvider,
                URLEncoder.encode(state, StandardCharsets.UTF_8)
        );

        log.info("소셜 로그인 시작 - provider: {}, redirectUri: {}", normalizedProvider, redirectUri);
        response.sendRedirect(authorizeUrl);
    }

    /**
     * OAuth 콜백 핸들러 (provider별)
     * - Cognito에서 authorization code를 받아 토큰으로 교환
     * - DB에 사용자 생성/조회
     * - JWT 발급 후 프론트엔드로 리다이렉트
     */
    @GetMapping("/callback/{provider}")
    public void handleOAuthCallback(
            @PathVariable String provider,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "error_description", required = false) String errorDescription,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        String normalizedProvider = provider.toLowerCase();

        // Before: state 검증 없음
        // After: CSRF 방어를 위한 state 파라미터 검증 추가
        // state 쿠키 삭제 (사용 후 즉시 삭제)
        ResponseCookie deleteStateCookie = cookieUtil.deleteOAuthStateCookie();
        cookieUtil.addCookie(response, deleteStateCookie);

        // 지원하지 않는 provider 체크
        if (!SUPPORTED_PROVIDERS.contains(normalizedProvider)) {
            log.warn("지원하지 않는 OAuth provider: {}", provider);
            response.sendRedirect(frontendUrl + "/login?error=unsupported_provider");
            return;
        }

        // 에러 응답 처리 (사용자가 로그인 취소한 경우 등)
        if (error != null) {
            log.warn("OAuth 에러 발생: {} - {}", error, errorDescription);
            String errorUrl = frontendUrl + "/login?error=" + URLEncoder.encode(error, StandardCharsets.UTF_8);
            response.sendRedirect(errorUrl);
            return;
        }

        // state 검증 (CSRF 방어)
        String storedState = cookieUtil.getOAuthStateFromCookie(request).orElse(null);
        if (state == null || storedState == null || !state.equals(storedState)) {
            log.warn("OAuth state 불일치 - CSRF 공격 의심. received: {}, stored: {}", state, storedState);
            response.sendRedirect(frontendUrl + "/login?error=invalid_state");
            return;
        }

        // code가 없는 경우
        if (code == null || code.isBlank()) {
            log.warn("Authorization code가 없습니다.");
            response.sendRedirect(frontendUrl + "/login?error=missing_code");
            return;
        }

        try {
            // 1. Cognito에서 토큰 교환 (provider별 redirect URI 사용)
            String callbackRedirectUri = getRedirectUri(normalizedProvider);
            CognitoTokenResponse cognitoTokens = cognitoAuthService.exchangeCodeForTokens(code, callbackRedirectUri);

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

            // Before: 토큰을 쿼리 파라미터(?)로 전달 - 서버 로그/Referer에 노출 위험
            // After: Fragment(#)로 전달 - 서버로 전송되지 않아 보안 강화
            // 6. 프론트엔드 콜백 페이지로 리다이렉트 (토큰은 URL Fragment로)
            String redirectUrl = frontendUrl + "/auth/callback#" +
                    "accessToken=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8) +
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
                    // Before: log.info("새 사용자 생성 - uuid: {}, email: {}", savedMember.getUuid(), savedMember.getEmail());
                    // After: PII(이메일) 로깅 제거 - uuid만 로깅하여 개인정보 보호
                    log.info("새 사용자 생성 - uuid: {}", savedMember.getUuid());
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
     * Provider별 Redirect URI 생성
     * - redirectUriBase가 설정되어 있으면: {base}/api/auth/callback/{provider}
     * - 없으면 defaultRedirectUri 사용 (기존 호환성)
     */
    private String getRedirectUri(String provider) {
        if (redirectUriBase != null && !redirectUriBase.isBlank()) {
            return redirectUriBase + "/api/auth/callback/" + provider;
        }
        return defaultRedirectUri;
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

        // Before: email이 null이어도 토큰 생성 진행
        // After: 삭제된 사용자(email null)인 경우 401 반환하여 보안 강화
        // DB에서 사용자 조회하여 이메일 가져오기
        Member member = memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(userId))
                .orElse(null);

        // 사용자가 존재하지 않거나 삭제된 경우 401 반환
        if (member == null || member.getEmail() == null) {
            log.warn("토큰 갱신 실패 - 사용자를 찾을 수 없음: {}", userId);
            ResponseCookie deleteCookie = cookieUtil.deleteRefreshTokenCookie();
            cookieUtil.addCookie(response, deleteCookie);

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.of(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "사용자를 찾을 수 없습니다."
                    ));
        }

        // 새로운 Access Token 생성
        String newAccessToken = jwtTokenProvider.createAccessToken(userId, member.getEmail());

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
     * 네이티브 앱 소셜 로그인
     * - 앱에서 Kakao/Google SDK로 받은 토큰을 검증하고 JWT 발급
     */
    @PostMapping("/social")
    // Before: @RequestBody만 사용 - @NotBlank 검증 미동작
    // After: @Valid 추가하여 DTO 검증 활성화
    public ResponseEntity<?> socialLogin(
            @Valid @RequestBody SocialLoginRequest request,
            HttpServletResponse response) {

        String provider = request.getProvider().toLowerCase();

        // 지원하지 않는 provider 체크
        if (!SUPPORTED_PROVIDERS.contains(provider)) {
            log.warn("지원하지 않는 OAuth provider: {}", provider);
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ErrorResponse.of(
                            HttpStatus.BAD_REQUEST.value(),
                            "Bad Request",
                            "지원하지 않는 provider입니다: " + provider
                    ));
        }

        try {
            // 1. 소셜 토큰 검증 및 사용자 정보 조회
            SocialUserInfo userInfo = socialAuthService.verifyTokenAndGetUserInfo(
                    provider,
                    request.getAccessToken(),
                    request.getIdToken()
            );

            // 2. DB에서 사용자 조회 또는 생성
            Member member = findOrCreateMemberFromSocial(userInfo);

            // 3. JWT 토큰 발급
            String accessToken = jwtTokenProvider.createAccessToken(
                    member.getUuid().toString(),
                    member.getEmail()
            );
            String refreshToken = jwtTokenProvider.createRefreshToken(member.getUuid().toString());

            // 4. Refresh Token을 HttpOnly 쿠키로 설정
            long maxAgeSeconds = jwtTokenProvider.getRefreshTokenValidity() / 1000;
            ResponseCookie refreshCookie = cookieUtil.createRefreshTokenCookie(refreshToken, maxAgeSeconds);
            cookieUtil.addCookie(response, refreshCookie);

            log.info("소셜 로그인 성공 (앱) - userId: {}, provider: {}", member.getUuid(), provider);

            // 5. Access Token 응답
            return ResponseEntity.ok(TokenResponse.of(
                    accessToken,
                    jwtTokenProvider.getAccessTokenValidity()
            ));

        } catch (Exception e) {
            log.error("소셜 로그인 실패: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.of(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "소셜 로그인에 실패했습니다: " + e.getMessage()
                    ));
        }
    }

    /**
     * 소셜 로그인 사용자 조회 또는 생성 (네이티브 앱용)
     */
    private Member findOrCreateMemberFromSocial(SocialUserInfo userInfo) {
        String cognitoSubFormat = userInfo.toCognitoSubFormat();

        return memberRepository.findByCognitoSubAndDeletedAtIsNull(cognitoSubFormat)
                .orElseGet(() -> {
                    Member newMember = Member.builder()
                            .uuid(UUID.randomUUID())
                            .cognitoSub(cognitoSubFormat)
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
                    // Before: log.info("새 사용자 생성 (앱) - uuid: {}, email: {}", savedMember.getUuid(), savedMember.getEmail());
                    // After: PII(이메일) 로깅 제거 - uuid만 로깅하여 개인정보 보호
                    log.info("새 사용자 생성 (앱) - uuid: {}", savedMember.getUuid());
                    return savedMember;
                });
    }

    /**
     * 헬스체크
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is healthy");
    }
}
