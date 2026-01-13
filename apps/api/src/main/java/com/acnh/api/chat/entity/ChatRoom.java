package com.acnh.api.chat.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 채팅방 Entity
 * - chat_rooms 테이블 매핑
 */
@Entity
@Table(name = "chat_rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "post_owner_id", nullable = false)
    private Long postOwnerId;

    @Column(name = "applicant_id", nullable = false)
    private Long applicantId;

    @Column(name = "reserved_user_id")
    private Long reservedUserId;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "scheduled_trade_at")
    private LocalDateTime scheduledTradeAt;

    @Builder
    public ChatRoom(Long postId, Long postOwnerId, Long applicantId,
                    Long reservedUserId, String status, LocalDateTime scheduledTradeAt) {
        this.postId = postId;
        this.postOwnerId = postOwnerId;
        this.applicantId = applicantId;
        this.reservedUserId = reservedUserId;
        this.status = status != null ? status : "ACTIVE";
        this.scheduledTradeAt = scheduledTradeAt;
    }

    /**
     * 상태 변경
     */
    public void updateStatus(String status) {
        this.status = status;
    }

    /**
     * 예약자 설정
     */
    public void reserve(Long userId, LocalDateTime scheduledAt) {
        this.reservedUserId = userId;
        this.scheduledTradeAt = scheduledAt;
    }

    /**
     * 예약 취소
     */
    public void cancelReservation() {
        this.reservedUserId = null;
        this.scheduledTradeAt = null;
    }

    /**
     * 거래 일정 변경
     */
    public void updateScheduledTradeAt(LocalDateTime scheduledTradeAt) {
        this.scheduledTradeAt = scheduledTradeAt;
    }
}
