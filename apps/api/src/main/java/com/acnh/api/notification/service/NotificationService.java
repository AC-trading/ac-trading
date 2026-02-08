package com.acnh.api.notification.service;

import com.acnh.api.common.exception.InvalidRequestException;
import com.acnh.api.common.exception.NotFoundException;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.notification.dto.NotificationListResponse;
import com.acnh.api.notification.dto.NotificationResponse;
import com.acnh.api.notification.entity.Notification;
import com.acnh.api.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 알림 관련 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MemberRepository memberRepository;

    /**
     * 내 알림 목록 조회 (페이징)
     */
    public NotificationListResponse getMyNotifications(String visitorId, Pageable pageable) {
        Member member = findMemberByUuid(visitorId);

        Page<Notification> notifications = notificationRepository
                .findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(member.getId(), pageable);
        long unreadCount = notificationRepository
                .countByUserIdAndIsReadFalseAndDeletedAtIsNull(member.getId());

        Page<NotificationResponse> responsePage = notifications.map(NotificationResponse::from);
        return NotificationListResponse.from(responsePage, unreadCount);
    }

    /**
     * 읽지 않은 알림 수 조회
     */
    public long getUnreadCount(String visitorId) {
        Member member = findMemberByUuid(visitorId);
        return notificationRepository.countByUserIdAndIsReadFalseAndDeletedAtIsNull(member.getId());
    }

    /**
     * 알림 읽음 처리
     */
    @Transactional
    public void markAsRead(Long notificationId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Notification notification = notificationRepository.findByIdAndDeletedAtIsNull(notificationId)
                .orElseThrow(() -> new NotFoundException("알림", notificationId));

        // 본인의 알림인지 확인
        if (!notification.getUserId().equals(member.getId())) {
            throw new InvalidRequestException("본인의 알림만 읽음 처리할 수 있습니다");
        }

        notification.markAsRead();
        log.info("알림 읽음 처리 - notificationId: {}, userId: {}", notificationId, member.getId());
    }

    /**
     * 모든 알림 읽음 처리
     */
    @Transactional
    public int markAllAsRead(String visitorId) {
        Member member = findMemberByUuid(visitorId);
        int count = notificationRepository.markAllAsReadByUserId(member.getId());
        log.info("모든 알림 읽음 처리 - userId: {}, count: {}", member.getId(), count);
        return count;
    }

    // ========== Private Helper Methods ==========

    /**
     * UUID로 회원 조회
     */
    private Member findMemberByUuid(String visitorId) {
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            throw new InvalidRequestException("로그인이 필요합니다");
        }
        // Before: UUID 형식이 아닌 visitorId → IllegalArgumentException → 500
        // After: try-catch로 400 반환
        UUID uuid;
        try {
            uuid = UUID.fromString(visitorId);
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException("유효하지 않은 사용자 식별자입니다");
        }
        return memberRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new NotFoundException("사용자", visitorId));
    }
}
