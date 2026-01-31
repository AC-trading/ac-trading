package com.acnh.api.keywordalarm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 키워드 알림 목록 응답 DTO
 */
@Getter
@AllArgsConstructor
@Builder
public class KeywordAlarmListResponse {

    private List<KeywordAlarmResponse> keywords;
    private int totalCount;

    public static KeywordAlarmListResponse of(List<KeywordAlarmResponse> keywords) {
        // null 방어 코드 추가 (CodeRabbit 리뷰 반영)
        List<KeywordAlarmResponse> safeKeywords = keywords != null ? keywords : List.of();
        return KeywordAlarmListResponse.builder()
                .keywords(safeKeywords)
                .totalCount(safeKeywords.size())
                .build();
    }
}
