package com.acnh.api.member.dto;

import com.acnh.api.member.entity.Member;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 회원 프로필 응답 DTO
 * - 내 프로필 조회, 특정 유저 프로필 조회에 사용
 */
@Getter
@Builder
public class MemberProfileResponse {

    private UUID id;
    private String nickname;
    private String islandName;
    private String dreamAddress;
    private String hemisphere;
    private Integer mannerScore;
    private Integer totalTradeCount;
    private Long reviewCount;
    private LocalDateTime createdAt;
    private boolean isProfileComplete;

    /**
     * Entity -> DTO 변환
     */
    public static MemberProfileResponse from(Member member, Long reviewCount) {
        return MemberProfileResponse.builder()
                .id(member.getUuid())
                .nickname(member.getNickname())
                .islandName(member.getIslandName())
                .dreamAddress(member.getDreamAddress())
                .hemisphere(member.getHemisphere())
                .mannerScore(member.getMannerScore())
                .totalTradeCount(member.getTotalTradeCount())
                .reviewCount(reviewCount)
                .createdAt(member.getCreatedAt())
                .isProfileComplete(member.isProfileComplete())
                .build();
    }
}
