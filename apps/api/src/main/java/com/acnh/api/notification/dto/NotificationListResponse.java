package com.acnh.api.notification.dto;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 알림 목록 페이징 응답 DTO
 */
@Getter
@Builder
public class NotificationListResponse {

    private List<NotificationResponse> notifications;
    private long unreadCount;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
    private boolean hasPrevious;

    /**
     * Page -> DTO 변환
     */
    public static NotificationListResponse from(Page<NotificationResponse> page, long unreadCount) {
        return NotificationListResponse.builder()
                .notifications(page.getContent())
                .unreadCount(unreadCount)
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
