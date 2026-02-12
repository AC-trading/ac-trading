package com.acnh.api.member.scheduler;

import com.acnh.api.member.entity.MannerScorePending;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MannerScorePendingRepository;
import com.acnh.api.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
     * 주기적으로 대기 중인 무 점수 변동 적용
     * - fixedRateString: 환경변수로 주기 설정 가능 (기본값 3600000ms = 1시간)
     */
    @Scheduled(fixedRateString = "${manner-score.scheduler.fixed-rate:3600000}")
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
            // Before: member 미발견 시 점수 적용 누락되지만 markApplied()로 무시됨 (점수 유실)
            // After: member 미발견 시 경고 로그 출력, markApplied()는 여전히 호출 (재시도 불필요하므로)
            Optional<Member> memberOpt = memberRepository.findById(pending.getMemberId());
            if (memberOpt.isPresent()) {
                Member member = memberOpt.get();
                if (pending.getScoreDelta() >= 0) {
                    member.increaseMannerScore(pending.getScoreDelta());
                } else {
                    member.decreaseMannerScore(Math.abs(pending.getScoreDelta()));
                }
            } else {
                log.warn("무 점수 적용 대상 회원 미발견 - pendingId: {}, memberId: {}, scoreDelta: {}",
                        pending.getId(), pending.getMemberId(), pending.getScoreDelta());
            }
            pending.markApplied();
            appliedCount++;
        }

        log.info("무 점수 지연 적용 완료 - 적용: {}건", appliedCount);
    }
}
