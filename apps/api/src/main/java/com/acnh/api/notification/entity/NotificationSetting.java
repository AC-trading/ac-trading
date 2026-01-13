package com.acnh.api.notification.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * 알림 설정 Entity
 * - notification_settings 테이블 매핑
 */
@Entity
@Table(name = "notification_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationSetting extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "chat_enabled", nullable = false)
    private Boolean chatEnabled;

    @Column(name = "like_alert_enabled", nullable = false)
    private Boolean likeAlertEnabled;

    @Column(name = "review_enabled", nullable = false)
    private Boolean reviewEnabled;

    @Column(name = "marketing_enabled", nullable = false)
    private Boolean marketingEnabled;

    @Column(name = "dnd_start")
    private LocalTime dndStart;

    @Column(name = "dnd_end")
    private LocalTime dndEnd;

    @Builder
    public NotificationSetting(Long userId, Boolean chatEnabled, Boolean likeAlertEnabled,
                               Boolean reviewEnabled, Boolean marketingEnabled,
                               LocalTime dndStart, LocalTime dndEnd) {
        this.userId = userId;
        this.chatEnabled = chatEnabled != null ? chatEnabled : true;
        this.likeAlertEnabled = likeAlertEnabled != null ? likeAlertEnabled : true;
        this.reviewEnabled = reviewEnabled != null ? reviewEnabled : true;
        this.marketingEnabled = marketingEnabled != null ? marketingEnabled : false;
        this.dndStart = dndStart;
        this.dndEnd = dndEnd;
    }

    /**
     * 기본 설정으로 생성
     */
    public static NotificationSetting createDefault(Long userId) {
        return NotificationSetting.builder()
                .userId(userId)
                .chatEnabled(true)
                .likeAlertEnabled(true)
                .reviewEnabled(true)
                .marketingEnabled(false)
                .build();
    }

    /**
     * 알림 설정 업데이트
     */
    public void update(Boolean chatEnabled, Boolean likeAlertEnabled,
                       Boolean reviewEnabled, Boolean marketingEnabled,
                       LocalTime dndStart, LocalTime dndEnd) {
        this.chatEnabled = chatEnabled;
        this.likeAlertEnabled = likeAlertEnabled;
        this.reviewEnabled = reviewEnabled;
        this.marketingEnabled = marketingEnabled;
        this.dndStart = dndStart;
        this.dndEnd = dndEnd;
    }

    /**
     * 방해금지 시간 설정
     */
    public void setDoNotDisturb(LocalTime start, LocalTime end) {
        this.dndStart = start;
        this.dndEnd = end;
    }

    /**
     * 방해금지 시간 해제
     */
    public void clearDoNotDisturb() {
        this.dndStart = null;
        this.dndEnd = null;
    }

    /**
     * 현재 방해금지 시간인지 확인
     */
    public boolean isInDoNotDisturbTime(LocalTime now) {
        if (dndStart == null || dndEnd == null) {
            return false;
        }

        if (dndStart.isBefore(dndEnd)) {
            return !now.isBefore(dndStart) && now.isBefore(dndEnd);
        } else {
            // 자정을 넘기는 경우 (예: 22:00 ~ 07:00)
            return !now.isBefore(dndStart) || now.isBefore(dndEnd);
        }
    }
}
