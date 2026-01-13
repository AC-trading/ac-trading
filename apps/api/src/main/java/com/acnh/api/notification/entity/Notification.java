package com.acnh.api.notification.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 알림 Entity
 * - notifications 테이블 매핑
 */
@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "requester_id")
    private Long requesterId;

    @Column(name = "offered_price")
    private Integer offeredPrice;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    @Builder
    public Notification(Long userId, String type, String title, String content,
                        Long referenceId, String referenceType, Long requesterId,
                        Integer offeredPrice) {
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.content = content;
        this.referenceId = referenceId;
        this.referenceType = referenceType;
        this.requesterId = requesterId;
        this.offeredPrice = offeredPrice;
        this.isRead = false;
    }

    /**
     * 읽음 처리
     */
    public void markAsRead() {
        this.isRead = true;
    }
}
