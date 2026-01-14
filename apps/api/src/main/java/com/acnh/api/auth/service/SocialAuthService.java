package com.acnh.api.auth.service;

import com.acnh.api.auth.dto.SocialUserInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 소셜 로그인 토큰 검증 서비스
 * - 네이티브 앱에서 받은 소셜 토큰을 검증하고 사용자 정보 조회
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SocialAuthService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

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
     * - ID Token이 있으면 파싱, 없으면 userinfo API 호출
     */
    private SocialUserInfo verifyGoogleToken(String accessToken, String idToken) {
        try {
            // ID Token이 있으면 파싱해서 사용 (더 빠름)
            if (idToken != null && !idToken.isBlank()) {
                return parseGoogleIdToken(idToken);
            }

            // Access Token으로 userinfo API 호출
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

            log.info("Google 사용자 정보 조회 성공 - sub: {}, email: {}", sub, email);

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
     * Google ID Token 파싱
     */
    private SocialUserInfo parseGoogleIdToken(String idToken) {
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("유효하지 않은 ID Token 형식입니다.");
            }

            String payload = new String(
                    Base64.getUrlDecoder().decode(parts[1]),
                    StandardCharsets.UTF_8
            );

            JsonNode claims = objectMapper.readTree(payload);

            String sub = claims.has("sub") ? claims.get("sub").asText() : null;
            String email = claims.has("email") ? claims.get("email").asText() : null;
            String name = claims.has("name") ? claims.get("name").asText() : null;
            String picture = claims.has("picture") ? claims.get("picture").asText() : null;

            log.info("Google ID Token 파싱 성공 - sub: {}, email: {}", sub, email);

            return SocialUserInfo.builder()
                    .provider("google")
                    .providerId(sub)
                    .email(email)
                    .name(name)
                    .picture(picture)
                    .build();

        } catch (Exception e) {
            log.error("Google ID Token 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("Google ID Token 파싱에 실패했습니다.", e);
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

            log.info("Kakao 사용자 정보 조회 성공 - id: {}, email: {}", id, email);

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
