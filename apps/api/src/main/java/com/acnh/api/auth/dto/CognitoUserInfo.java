package com.acnh.api.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Cognito ID Token에서 파싱한 사용자 정보 DTO
 * - ID Token의 Claims에서 추출
 */
@Getter
@NoArgsConstructor
public class CognitoUserInfo {

    // Cognito User의 고유 식별자
    private String sub;

    // 이메일
    private String email;

    // 이메일 인증 여부
    @JsonProperty("email_verified")
    private Boolean emailVerified;

    // OAuth Provider (Google, Kakao 등)
    // identities claim에서 추출 또는 cognito:username에서 파싱
    private String provider;

    // Provider에서의 사용자 ID
    private String providerId;

    // 이름 (선택적)
    private String name;

    // 프로필 이미지 (선택적)
    private String picture;

    public CognitoUserInfo(String sub, String email, Boolean emailVerified,
                           String provider, String providerId, String name, String picture) {
        this.sub = sub;
        this.email = email;
        this.emailVerified = emailVerified;
        this.provider = provider;
        this.providerId = providerId;
        this.name = name;
        this.picture = picture;
    }
}
