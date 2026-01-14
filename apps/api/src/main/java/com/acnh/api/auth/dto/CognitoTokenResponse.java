package com.acnh.api.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Cognito 토큰 교환 응답 DTO
 * - Cognito OAuth2 /oauth2/token 엔드포인트 응답 매핑
 */
@Getter
@NoArgsConstructor
public class CognitoTokenResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("id_token")
    private String idToken;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("token_type")
    private String tokenType;

    @JsonProperty("expires_in")
    private Integer expiresIn;
}
