package com.acnh.api.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 신규 유저 프로필 초기 설정 요청 DTO
 * - 닉네임, 섬 이름 필수
 * - 반구, 꿈번지 선택
 */
@Getter
@NoArgsConstructor
public class ProfileSetupRequest {

    @NotBlank(message = "닉네임은 필수입니다")
    @Size(min = 2, max = 50, message = "닉네임은 2~50자 사이여야 합니다")
    private String nickname;

    @NotBlank(message = "섬 이름은 필수입니다")
    @Size(min = 1, max = 50, message = "섬 이름은 1~50자 사이여야 합니다")
    private String islandName;

    // 선택 필드
    @Size(max = 20, message = "꿈번지 코드는 20자 이내여야 합니다")
    private String dreamAddress;

    // 선택 필드 (기본값: NORTH)
    private String hemisphere;
}
