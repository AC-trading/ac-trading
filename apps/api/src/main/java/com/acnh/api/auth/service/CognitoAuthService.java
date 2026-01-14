package com.acnh.api.auth.service;

import com.acnh.api.auth.dto.CognitoTokenResponse;
import com.acnh.api.auth.dto.CognitoUserInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Cognito OAuth 인증 서비스
 * - Authorization Code를 Cognito 토큰으로 교환
 * - ID Token에서 사용자 정보 파싱
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CognitoAuthService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${cognito.domain}")
    private String cognitoDomain;

    @Value("${cognito.client-id}")
    private String clientId;

    @Value("${cognito.client-secret}")
    private String clientSecret;

    @Value("${cognito.redirect-uri}")
    private String redirectUri;

    /**
     * Authorization Code를 Cognito 토큰으로 교환
     * - code: Cognito에서 받은 authorization code
     * - 반환: access_token, id_token, refresh_token 포함
     */
    public CognitoTokenResponse exchangeCodeForTokens(String code) {
        String tokenEndpoint = String.format("https://%s/oauth2/token", cognitoDomain);

        // Basic Auth 헤더 생성 (client_id:client_secret)
        String credentials = clientId + ":" + clientSecret;
        String encodedCredentials = Base64.getEncoder()
                .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + encodedCredentials);

        // 요청 바디 구성
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", redirectUri);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<CognitoTokenResponse> response = restTemplate.exchange(
                    tokenEndpoint,
                    HttpMethod.POST,
                    request,
                    CognitoTokenResponse.class
            );

            log.info("Cognito 토큰 교환 성공");
            return response.getBody();
        } catch (Exception e) {
            log.error("Cognito 토큰 교환 실패: {}", e.getMessage());
            throw new RuntimeException("Cognito 토큰 교환에 실패했습니다.", e);
        }
    }

    /**
     * ID Token에서 사용자 정보 파싱
     * - JWT의 payload 부분을 Base64 디코딩하여 클레임 추출
     */
    public CognitoUserInfo parseIdToken(String idToken) {
        try {
            // JWT는 header.payload.signature 형식
            String[] parts = idToken.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("유효하지 않은 ID Token 형식입니다.");
            }

            // payload 디코딩
            String payload = new String(
                    Base64.getUrlDecoder().decode(parts[1]),
                    StandardCharsets.UTF_8
            );

            JsonNode claims = objectMapper.readTree(payload);

            String sub = claims.has("sub") ? claims.get("sub").asText() : null;
            String email = claims.has("email") ? claims.get("email").asText() : null;
            Boolean emailVerified = claims.has("email_verified") ? claims.get("email_verified").asBoolean() : null;
            String name = claims.has("name") ? claims.get("name").asText() : null;
            String picture = claims.has("picture") ? claims.get("picture").asText() : null;

            // Provider 정보 추출 (cognito:username 또는 identities에서)
            String provider = "cognito";
            String providerId = sub;

            // cognito:username 형식: "Google_123456789" 또는 "Kakao_987654321"
            if (claims.has("cognito:username")) {
                String cognitoUsername = claims.get("cognito:username").asText();
                if (cognitoUsername.contains("_")) {
                    String[] providerParts = cognitoUsername.split("_", 2);
                    provider = providerParts[0].toLowerCase();
                    providerId = providerParts[1];
                }
            }

            // identities 배열에서 provider 정보 추출 (대안)
            if (claims.has("identities") && claims.get("identities").isArray()) {
                JsonNode identities = claims.get("identities").get(0);
                if (identities != null) {
                    if (identities.has("providerName")) {
                        provider = identities.get("providerName").asText().toLowerCase();
                    }
                    if (identities.has("userId")) {
                        providerId = identities.get("userId").asText();
                    }
                }
            }

            log.info("ID Token 파싱 완료 - sub: {}, email: {}, provider: {}", sub, email, provider);

            return new CognitoUserInfo(sub, email, emailVerified, provider, providerId, name, picture);
        } catch (Exception e) {
            log.error("ID Token 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("ID Token 파싱에 실패했습니다.", e);
        }
    }

    /**
     * Cognito Refresh Token으로 새 Access Token 발급
     */
    public CognitoTokenResponse refreshToken(String refreshToken) {
        String tokenEndpoint = String.format("https://%s/oauth2/token", cognitoDomain);

        // Basic Auth 헤더 생성
        String credentials = clientId + ":" + clientSecret;
        String encodedCredentials = Base64.getEncoder()
                .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + encodedCredentials);

        // 요청 바디 구성
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("refresh_token", refreshToken);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<CognitoTokenResponse> response = restTemplate.exchange(
                    tokenEndpoint,
                    HttpMethod.POST,
                    request,
                    CognitoTokenResponse.class
            );

            log.info("Cognito 토큰 갱신 성공");
            return response.getBody();
        } catch (Exception e) {
            log.error("Cognito 토큰 갱신 실패: {}", e.getMessage());
            throw new RuntimeException("Cognito 토큰 갱신에 실패했습니다.", e);
        }
    }
}
