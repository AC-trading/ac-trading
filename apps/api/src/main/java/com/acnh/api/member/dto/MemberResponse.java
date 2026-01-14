package com.acnh.api.member.dto;

import com.acnh.api.member.entity.Member;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/**
 * 회원 정보 응답 DTO
 */
@Getter
@Builder
public class MemberResponse {

    private UUID id;
    private String email;
    private String nickname;
    private String islandName;
    private String dreamAddress;
    private String hemisphere;
    private Integer mannerScore;
    private Integer totalTradeCount;

    /**
     * Entity -> DTO 변환
     */
    public static MemberResponse from(Member member) {
        return MemberResponse.builder()
                .id(member.getUuid())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .islandName(member.getIslandName())
                .dreamAddress(member.getDreamAddress())
                .hemisphere(member.getHemisphere())
                .mannerScore(member.getMannerScore())
                .totalTradeCount(member.getTotalTradeCount())
                .build();
    }
}
