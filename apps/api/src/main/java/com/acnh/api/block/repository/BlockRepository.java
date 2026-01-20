package com.acnh.api.block.repository;

import com.acnh.api.block.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 차단 Repository
 */
public interface BlockRepository extends JpaRepository<Block, Long> {

    /**
     * 차단 관계 존재 여부 확인
     */
    boolean existsByBlockerIdAndBlockedIdAndDeletedAtIsNull(Long blockerId, Long blockedId);

    /**
     * 차단 관계 조회
     */
    Optional<Block> findByBlockerIdAndBlockedIdAndDeletedAtIsNull(Long blockerId, Long blockedId);

    /**
     * 내가 차단한 사용자 목록 조회
     */
    List<Block> findByBlockerIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long blockerId);

    /**
     * 내가 차단한 사용자 ID 목록 조회 (필터링용)
     */
    List<Block> findByBlockerIdAndDeletedAtIsNull(Long blockerId);
}
