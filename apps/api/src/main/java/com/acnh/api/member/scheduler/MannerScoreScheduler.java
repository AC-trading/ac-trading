package com.acnh.api.member.scheduler;

import com.acnh.api.member.entity.MannerScorePending;
import com.acnh.api.member.repository.MannerScorePendingRepository;
import com.acnh.api.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 무 점수 지연 적용 스케줄러
 * - 리뷰 수신 시 예약된 점수 변동을 3일 후 실제 적용
 * - 상대방이 준 점수를 유추하지 못하도록 지연 적용
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MannerScoreScheduler {

    private final MannerScorePendingRepository mannerScorePendingRepository;
    private final MemberRepository memberRepository;

    /**
     * 1시간마다 대기 중인 무 점수 변동 적용
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void applyPendingMannerScores() {
        List<MannerScorePending> pendingList =
                mannerScorePendingRepository.findByAppliedFalseAndApplyAtBefore(LocalDateTime.now());

        if (pendingList.isEmpty()) {
            return;
        }

        log.info("무 점수 지연 적용 시작 - 대상: {}건", pendingList.size());

        int appliedCount = 0;
        for (MannerScorePending pending : pendingList) {
            memberRepository.findById(pending.getMemberId()).ifPresent(member -> {
                if (pending.getScoreDelta() >= 0) {
                    member.increaseMannerScore(pending.getScoreDelta());
                } else {
                    member.decreaseMannerScore(Math.abs(pending.getScoreDelta()));
                }
            });
            pending.markApplied();
            appliedCount++;
        }

        log.info("무 점수 지연 적용 완료 - 적용: {}건", appliedCount);
    }
}
