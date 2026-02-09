package com.acnh.api.member.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 무 점수 지연 적용 Entity
 * - 리뷰 수신 시 점수 변동을 3일 후 적용하기 위한 대기 테이블
 * - 상대방이 준 점수를 유추하지 못하도록 지연 적용
 */
@Entity
@Table(name = "manner_score_pending")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MannerScorePending {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "review_id", nullable = false)
    private Long reviewId;

    // 적용할 점수 변동량 (양수: 증가, 음수: 감소)
    @Column(name = "score_delta", nullable = false)
    private Integer scoreDelta;

    // 이 시점 이후에 적용
    @Column(name = "apply_at", nullable = false)
    private LocalDateTime applyAt;

    // 적용 완료 여부
    @Column(name = "applied", nullable = false)
    private Boolean applied;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public MannerScorePending(Long memberId, Long reviewId, Integer scoreDelta, LocalDateTime applyAt) {
        this.memberId = memberId;
        this.reviewId = reviewId;
        this.scoreDelta = scoreDelta;
        this.applyAt = applyAt;
        this.applied = false;
        this.createdAt = LocalDateTime.now();
    }

    /**
     * 적용 완료 처리
     */
    public void markApplied() {
        this.applied = true;
    }
}
