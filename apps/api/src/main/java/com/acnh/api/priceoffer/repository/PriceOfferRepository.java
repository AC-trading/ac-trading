package com.acnh.api.priceoffer.repository;

import com.acnh.api.priceoffer.entity.PriceOffer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 가격 제안 Repository
 */
public interface PriceOfferRepository extends JpaRepository<PriceOffer, Long> {

    /**
     * ID로 삭제되지 않은 제안 조회
     */
    Optional<PriceOffer> findByIdAndDeletedAtIsNull(Long id);

    /**
     * 게시글 ID로 삭제되지 않은 제안 목록 조회 (생성일 내림차순)
     */
    List<PriceOffer> findByPostIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long postId);

    /**
     * 게시글 ID와 제안자 ID로 대기 중인 제안 조회 (비관적 락)
     * - 동일 게시글에 중복 제안 방지용
     * - SELECT FOR UPDATE로 동시 요청 시 Race Condition 방지
     *
     * [PR Review 수정]
     * Before: 일반 조회로 Race Condition 취약
     * After: PESSIMISTIC_WRITE 락으로 동시 요청 직렬화
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PriceOffer p WHERE p.postId = :postId AND p.offererId = :offererId " +
            "AND p.status = :status AND p.deletedAt IS NULL")
    Optional<PriceOffer> findByPostIdAndOffererIdAndStatusWithLock(
            @Param("postId") Long postId, @Param("offererId") Long offererId, @Param("status") String status);

    /**
     * 게시글 ID와 제안자 ID로 대기 중인 제안 조회 (일반 조회)
     * - 읽기 전용 조회에 사용
     */
    Optional<PriceOffer> findByPostIdAndOffererIdAndStatusAndDeletedAtIsNull(
            Long postId, Long offererId, String status);

    /**
     * 제안자 ID로 삭제되지 않은 제안 목록 조회 (생성일 내림차순)
     */
    List<PriceOffer> findByOffererIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long offererId);

    /**
     * 게시글 작성자 ID로 삭제되지 않은 제안 목록 조회 (생성일 내림차순)
     */
    List<PriceOffer> findByPostOwnerIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long postOwnerId);

    /**
     * 가격 제안 원자적 수락
     * - Race Condition 방지를 위해 WHERE 조건에 status = 'PENDING' 포함
     * - 반환값이 0이면 이미 처리된 제안
     */
    @Modifying
    @Transactional
    @Query("UPDATE PriceOffer p SET p.status = 'ACCEPTED', p.updatedAt = CURRENT_TIMESTAMP " +
            "WHERE p.id = :id AND p.status = 'PENDING' AND p.deletedAt IS NULL")
    int acceptPriceOfferAtomic(@Param("id") Long id);

    /**
     * 가격 제안 원자적 거절
     * - Race Condition 방지를 위해 WHERE 조건에 status = 'PENDING' 포함
     * - 반환값이 0이면 이미 처리된 제안
     */
    @Modifying
    @Transactional
    @Query("UPDATE PriceOffer p SET p.status = 'REJECTED', p.updatedAt = CURRENT_TIMESTAMP " +
            "WHERE p.id = :id AND p.status = 'PENDING' AND p.deletedAt IS NULL")
    int rejectPriceOfferAtomic(@Param("id") Long id);
}
