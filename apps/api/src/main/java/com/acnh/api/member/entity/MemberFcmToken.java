package com.acnh.api.member.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * FCM 푸시 토큰 Entity
 * - user_fcm_tokens 테이블 매핑
 */
@Entity
@Table(name = "user_fcm_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberFcmToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long memberId;

    @Column(name = "fcm_token", nullable = false, length = 500)
    private String fcmToken;

    @Column(name = "device_type", nullable = false, length = 20)
    private String deviceType;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Builder
    public MemberFcmToken(Long memberId, String fcmToken, String deviceType,
                          String deviceId, Boolean isActive) {
        this.memberId = memberId;
        this.fcmToken = fcmToken;
        this.deviceType = deviceType;
        this.deviceId = deviceId;
        this.isActive = isActive != null ? isActive : true;
    }

    /**
     * 토큰 비활성화
     */
    public void deactivate() {
        this.isActive = false;
    }

    /**
     * 토큰 활성화
     */
    public void activate() {
        this.isActive = true;
    }

    /**
     * 마지막 사용 시간 갱신
     */
    public void updateLastUsedAt() {
        this.lastUsedAt = LocalDateTime.now();
    }

    /**
     * FCM 토큰 갱신
     */
    public void updateFcmToken(String newToken) {
        this.fcmToken = newToken;
        this.lastUsedAt = LocalDateTime.now();
    }
}
