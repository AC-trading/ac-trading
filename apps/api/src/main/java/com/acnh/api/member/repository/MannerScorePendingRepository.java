package com.acnh.api.member.repository;

import com.acnh.api.member.entity.MannerScorePending;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 무 점수 지연 적용 Repository
 */
public interface MannerScorePendingRepository extends JpaRepository<MannerScorePending, Long> {

    /**
     * 적용 대상 조회: 적용 시점이 지났고 아직 미적용인 레코드
     */
    List<MannerScorePending> findByAppliedFalseAndApplyAtBefore(LocalDateTime now);
}
