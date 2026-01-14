package com.acnh.api.auth.dto;

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

    @NotBlank(message = "accessToken은 필수입니다.")
    private String accessToken;  // 소셜 SDK에서 받은 access token

    // ID Token (Google의 경우 선택적으로 사용)
    private String idToken;

    public SocialLoginRequest(String provider, String accessToken, String idToken) {
        this.provider = provider;
        this.accessToken = accessToken;
        this.idToken = idToken;
    }
}
