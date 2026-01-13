package com.acnh.api.member.repository;

import com.acnh.api.member.entity.UserFcmToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * FCM 토큰 Repository
 */
public interface UserFcmTokenRepository extends JpaRepository<UserFcmToken, Long> {

    /**
     * 사용자 ID로 활성화된 FCM 토큰 목록 조회
     */
    List<UserFcmToken> findByUserIdAndIsActiveTrueAndDeletedAtIsNull(Long userId);

    /**
     * FCM 토큰으로 활성화된 토큰 조회
     */
    Optional<UserFcmToken> findByFcmTokenAndIsActiveTrueAndDeletedAtIsNull(String fcmToken);

    /**
     * 사용자 ID와 디바이스 ID로 활성화된 토큰 조회
     */
    Optional<UserFcmToken> findByUserIdAndDeviceIdAndIsActiveTrueAndDeletedAtIsNull(Long userId, String deviceId);

    /**
     * FCM 토큰 존재 여부 확인
     */
    boolean existsByFcmTokenAndIsActiveTrueAndDeletedAtIsNull(String fcmToken);
}
