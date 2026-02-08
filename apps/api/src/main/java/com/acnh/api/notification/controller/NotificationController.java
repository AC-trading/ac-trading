package com.acnh.api.notification.controller;

import com.acnh.api.notification.dto.NotificationListResponse;
import com.acnh.api.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 알림 관련 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private static final int DEFAULT_PAGE_SIZE = 20;

    /**
     * 내 알림 목록 조회
     * GET /api/notifications
     */
    @GetMapping
    public ResponseEntity<?> getMyNotifications(
            @AuthenticationPrincipal String visitorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("알림 목록 조회 요청 - visitorId: {}, page: {}, size: {}", visitorId, page, size);

        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
        NotificationListResponse response = notificationService.getMyNotifications(visitorId, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * 읽지 않은 알림 수 조회
     * GET /api/notifications/unread-count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(
            @AuthenticationPrincipal String visitorId) {

        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        long count = notificationService.getUnreadCount(visitorId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * 알림 읽음 처리
     * PATCH /api/notifications/{id}/read
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long id) {

        log.info("알림 읽음 처리 요청 - notificationId: {}, visitorId: {}", id, visitorId);

        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        notificationService.markAsRead(id, visitorId);
        return ResponseEntity.ok(Map.of("message", "읽음 처리되었습니다"));
    }

    /**
     * 모든 알림 읽음 처리
     * PATCH /api/notifications/read-all
     */
    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(
            @AuthenticationPrincipal String visitorId) {

        log.info("모든 알림 읽음 처리 요청 - visitorId: {}", visitorId);

        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        int count = notificationService.markAllAsRead(visitorId);
        return ResponseEntity.ok(Map.of(
                "message", "모든 알림이 읽음 처리되었습니다",
                "count", count
        ));
    }
}
