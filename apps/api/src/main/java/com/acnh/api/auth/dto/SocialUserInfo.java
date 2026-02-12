package com.acnh.api.auth.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 소셜 로그인 사용자 정보 DTO
 * - Google/Kakao API에서 조회한 사용자 정보
 */
@Getter
@Builder
public class SocialUserInfo {

    private String provider;      // google, kakao
    private String providerId;    // 소셜 서비스에서의 고유 ID
    private String email;
    private String name;
    private String picture;

    /**
     * Cognito Sub 형식으로 변환 (기존 Member 엔티티와 호환)
     * - 형식: {Provider}_{ProviderId}
     */
    public String toCognitoSubFormat() {
        return provider.substring(0, 1).toUpperCase() + provider.substring(1) + "_" + providerId;
    }
}
