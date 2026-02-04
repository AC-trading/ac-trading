package com.acnh.api.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 네이티브 앱 소셜 로그인 요청 DTO
 * - 앱에서 Kakao/Google SDK로 받은 토큰을 백엔드로 전달
 */
@Getter
@NoArgsConstructor
public class SocialLoginRequest {

    @NotBlank(message = "provider는 필수입니다.")
    private String provider;  // google, kakao

    // Kakao: accessToken 필수, Google: idToken 필수
    private String accessToken;  // 소셜 SDK에서 받은 access token (Kakao용)

    // Google 네이티브 SDK는 idToken만 제공
    private String idToken;

    public SocialLoginRequest(String provider, String accessToken, String idToken) {
        this.provider = provider;
        this.accessToken = accessToken;
        this.idToken = idToken;
    }

    /**
     * CodeRabbit 리뷰 반영: provider별 토큰 필드 검증
     * - Google: idToken 필수
     * - Kakao: accessToken 필수
     */
    @AssertTrue(message = "Google 로그인은 idToken이 필수입니다.")
    private boolean isGoogleTokenValid() {
        if (!"google".equalsIgnoreCase(provider)) {
            return true;
        }
        return idToken != null && !idToken.isBlank();
    }

    @AssertTrue(message = "Kakao 로그인은 accessToken이 필수입니다.")
    private boolean isKakaoTokenValid() {
        if (!"kakao".equalsIgnoreCase(provider)) {
            return true;
        }
        return accessToken != null && !accessToken.isBlank();
    }
}
