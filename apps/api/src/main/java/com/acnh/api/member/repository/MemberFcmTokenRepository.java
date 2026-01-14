package com.acnh.api.member.repository;

import com.acnh.api.member.entity.MemberFcmToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * FCM 푸시 토큰 Repository
 */
public interface MemberFcmTokenRepository extends JpaRepository<MemberFcmToken, Long> {

    /**
     * 회원 ID로 활성화된 FCM 토큰 목록 조회
     */
    List<MemberFcmToken> findByMemberIdAndIsActiveTrueAndDeletedAtIsNull(Long memberId);

    /**
     * FCM 토큰으로 조회
     */
    Optional<MemberFcmToken> findByFcmTokenAndDeletedAtIsNull(String fcmToken);

    /**
     * 회원 ID와 디바이스 ID로 조회
     */
    Optional<MemberFcmToken> findByMemberIdAndDeviceIdAndDeletedAtIsNull(Long memberId, String deviceId);
}
