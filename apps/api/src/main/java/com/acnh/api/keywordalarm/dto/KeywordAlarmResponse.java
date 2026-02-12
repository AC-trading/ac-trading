package com.acnh.api.keywordalarm.dto;

import com.acnh.api.keywordalarm.entity.KeywordAlarm;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 키워드 알림 응답 DTO
 */
@Getter
@AllArgsConstructor
@Builder
public class KeywordAlarmResponse {

    private Long id;
    private String keyword;
    private LocalDateTime createdAt;

    public static KeywordAlarmResponse from(KeywordAlarm entity) {
        return KeywordAlarmResponse.builder()
                .id(entity.getId())
                .keyword(entity.getKeyword())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
