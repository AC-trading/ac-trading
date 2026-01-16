package com.acnh.api.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 공통 BaseEntity
 * - 모든 Entity가 상속받아 사용
 * - created_at, updated_at, deleted_at 자동 관리
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
public abstract class BaseEntity {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Soft delete 처리
     */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * Soft delete 복구
     */
    public void restore() {
        this.deletedAt = null;
    }

    /**
     * 삭제 여부 확인
     */
    public boolean isDeleted() {
        return this.deletedAt != null;
    }

    /**
     * updatedAt 강제 갱신 (연관 데이터 변경 시 사용)
     * - 예: 채팅방에 새 메시지 추가 시 채팅방 updatedAt 갱신
     */
    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
