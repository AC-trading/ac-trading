package com.acnh.api.notification.dto;

import com.acnh.api.notification.entity.Notification;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 알림 응답 DTO
 */
@Getter
@Builder
public class NotificationResponse {

    private Long id;
    private String type;
    private String title;
    private String content;
    private Long referenceId;
    private String referenceType;
    // Lombok @Getter가 boolean isRead에 대해 isRead() getter를 생성하면
    // Jackson이 "is" 접두사를 제거하여 "read"로 직렬화함 → @JsonProperty로 명시
    @JsonProperty("isRead")
    private Boolean isRead;
    private LocalDateTime createdAt;

    /**
     * Entity -> DTO 변환
     */
    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .content(notification.getContent())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
