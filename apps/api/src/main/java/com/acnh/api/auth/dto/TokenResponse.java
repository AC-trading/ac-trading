package com.acnh.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 토큰 응답 DTO
 * - accessToken: 프론트에서 localStorage에 저장
 * - refreshToken은 HttpOnly 쿠키로 전달되므로 응답 바디에 포함하지 않음
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;
    private String tokenType;
    private long expiresIn;  // 초 단위

    public static TokenResponse of(String accessToken, long expiresInMillis) {
        return TokenResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(expiresInMillis / 1000)  // 밀리초 -> 초 변환
                .build();
    }
}
