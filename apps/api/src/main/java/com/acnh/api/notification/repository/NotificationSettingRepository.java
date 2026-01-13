package com.acnh.api.notification.repository;

import com.acnh.api.notification.entity.NotificationSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 알림 설정 Repository
 */
public interface NotificationSettingRepository extends JpaRepository<NotificationSetting, Long> {

    /**
     * 사용자 ID로 삭제되지 않은 알림 설정 조회
     */
    Optional<NotificationSetting> findByUserIdAndDeletedAtIsNull(Long userId);

    /**
     * 사용자 ID로 알림 설정 존재 여부 확인
     */
    boolean existsByUserIdAndDeletedAtIsNull(Long userId);
}
