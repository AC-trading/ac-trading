package com.acnh.api.auth.service;

import com.acnh.api.auth.dto.SocialUserInfo;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * 소셜 로그인 토큰 검증 서비스
 * - 네이티브 앱에서 받은 소셜 토큰을 검증하고 사용자 정보 조회
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SocialAuthService {

    private final RestTemplate restTemplate;

    @Value("${google.client-id:}")
    private String googleClientId;

    private static final String GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
    private static final String KAKAO_USERINFO_URL = "https://kapi.kakao.com/v2/user/me";

    /**
     * 소셜 토큰 검증 및 사용자 정보 조회
     */
    public SocialUserInfo verifyTokenAndGetUserInfo(String provider, String accessToken, String idToken) {
        return switch (provider.toLowerCase()) {
            case "google" -> verifyGoogleToken(accessToken, idToken);
            case "kakao" -> verifyKakaoToken(accessToken);
            default -> throw new IllegalArgumentException("지원하지 않는 provider입니다: " + provider);
        };
    }

    /**
     * Google 토큰 검증 및 사용자 정보 조회
     * - 네이티브 SDK: idToken만 제공 → Google tokeninfo API로 검증
     * - 웹/기타: accessToken 제공 시 → Google userinfo API로 검증
     */
    private SocialUserInfo verifyGoogleToken(String accessToken, String idToken) {
        try {
            // 네이티브 앱 SDK: idToken만 있는 경우 tokeninfo API 사용
            if ((accessToken == null || accessToken.isBlank()) && idToken != null && !idToken.isBlank()) {
                return verifyGoogleIdToken(idToken);
            }

            // accessToken이 있는 경우 userinfo API 사용
            if (accessToken == null || accessToken.isBlank()) {
                throw new RuntimeException("Google accessToken 또는 idToken이 필요합니다.");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);

            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    GOOGLE_USERINFO_URL,
                    HttpMethod.GET,
                    request,
                    JsonNode.class
            );

            JsonNode body = response.getBody();
            if (body == null) {
                throw new RuntimeException("Google 사용자 정보를 가져올 수 없습니다.");
            }

            String sub = body.has("sub") ? body.get("sub").asText() : null;
            String email = body.has("email") ? body.get("email").asText() : null;
            String name = body.has("name") ? body.get("name").asText() : null;
            String picture = body.has("picture") ? body.get("picture").asText() : null;

            log.info("Google 사용자 정보 조회 성공 (userinfo) - sub: {}", sub);

            return SocialUserInfo.builder()
                    .provider("google")
                    .providerId(sub)
                    .email(email)
                    .name(name)
                    .picture(picture)
                    .build();

        } catch (Exception e) {
            log.error("Google 토큰 검증 실패: {}", e.getMessage());
            throw new RuntimeException("Google 토큰 검증에 실패했습니다.", e);
        }
    }

    /**
     * Google ID Token 검증 (네이티브 앱 SDK용)
     * - Google tokeninfo API를 호출하여 idToken 검증
     */
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private SocialUserInfo verifyGoogleIdToken(String idToken) {
        try {
            // Google tokeninfo API로 idToken 검증
            String url = GOOGLE_TOKENINFO_URL + "?id_token=" + idToken;

            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);

            JsonNode body = response.getBody();
            if (body == null) {
                throw new RuntimeException("Google ID Token 검증 실패: 응답이 없습니다.");
            }

            // 에러 응답 체크
            if (body.has("error")) {
                throw new RuntimeException("Google ID Token 검증 실패: " + body.get("error").asText());
            }

            // aud(audience) 검증: 토큰이 우리 앱용으로 발급됐는지 확인
            if (googleClientId != null && !googleClientId.isBlank()) {
                String aud = body.has("aud") ? body.get("aud").asText() : null;
                if (aud == null || !aud.equals(googleClientId)) {
                    log.error("Google ID Token aud 불일치 - expected: {}, actual: {}", googleClientId, aud);
                    throw new RuntimeException("Google ID Token 검증 실패: aud 불일치 (토큰이 다른 앱용으로 발급됨)");
                }
            } else {
                log.warn("GOOGLE_CLIENT_ID가 설정되지 않아 aud 검증을 건너뜁니다.");
            }

            String sub = body.has("sub") ? body.get("sub").asText() : null;
            String email = body.has("email") ? body.get("email").asText() : null;
            String name = body.has("name") ? body.get("name").asText() : null;
            String picture = body.has("picture") ? body.get("picture").asText() : null;

            log.info("Google 사용자 정보 조회 성공 (tokeninfo) - sub: {}", sub);

            return SocialUserInfo.builder()
                    .provider("google")
                    .providerId(sub)
                    .email(email)
                    .name(name)
                    .picture(picture)
                    .build();

        } catch (Exception e) {
            log.error("Google ID Token 검증 실패: {}", e.getMessage());
            throw new RuntimeException("Google ID Token 검증에 실패했습니다.", e);
        }
    }

    /**
     * Kakao 토큰 검증 및 사용자 정보 조회
     */
    private SocialUserInfo verifyKakaoToken(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    KAKAO_USERINFO_URL,
                    HttpMethod.GET,
                    request,
                    JsonNode.class
            );

            JsonNode body = response.getBody();
            if (body == null) {
                throw new RuntimeException("Kakao 사용자 정보를 가져올 수 없습니다.");
            }

            // Kakao 응답 구조: { id, kakao_account: { email, profile: { nickname, profile_image_url } } }
            String id = body.has("id") ? body.get("id").asText() : null;

            String email = null;
            String nickname = null;
            String profileImage = null;

            if (body.has("kakao_account")) {
                JsonNode kakaoAccount = body.get("kakao_account");
                email = kakaoAccount.has("email") ? kakaoAccount.get("email").asText() : null;

                if (kakaoAccount.has("profile")) {
                    JsonNode profile = kakaoAccount.get("profile");
                    nickname = profile.has("nickname") ? profile.get("nickname").asText() : null;
                    profileImage = profile.has("profile_image_url") ? profile.get("profile_image_url").asText() : null;
                }
            }

            // Before: log.info("Kakao 사용자 정보 조회 성공 - id: {}, email: {}", id, email);
            // After: PII(이메일) 로깅 제거
            log.info("Kakao 사용자 정보 조회 성공 - id: {}", id);

            return SocialUserInfo.builder()
                    .provider("kakao")
                    .providerId(id)
                    .email(email)
                    .name(nickname)
                    .picture(profileImage)
                    .build();

        } catch (Exception e) {
            log.error("Kakao 토큰 검증 실패: {}", e.getMessage());
            throw new RuntimeException("Kakao 토큰 검증에 실패했습니다.", e);
        }
    }
}
