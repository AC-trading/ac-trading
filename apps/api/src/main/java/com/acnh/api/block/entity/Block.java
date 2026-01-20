package com.acnh.api.block.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 차단 Entity
 * - blocks 테이블 매핑
 * - 사용자 간 차단 관계 저장
 */
@Entity
@Table(name = "blocks", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"blocker_id", "blocked_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Block extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 차단한 사용자 ID
    @Column(name = "blocker_id", nullable = false)
    private Long blockerId;

    // 차단당한 사용자 ID
    @Column(name = "blocked_id", nullable = false)
    private Long blockedId;

    // 차단 사유 (선택)
    @Column(name = "reason", length = 500)
    private String reason;

    @Builder
    public Block(Long blockerId, Long blockedId, String reason) {
        this.blockerId = blockerId;
        this.blockedId = blockedId;
        this.reason = reason;
    }
}
