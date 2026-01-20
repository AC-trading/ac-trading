package com.acnh.api.priceoffer.repository;

import com.acnh.api.priceoffer.entity.PriceOffer;
import org.springframework.data.jpa.repository.JpaRepository;

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
     * 게시글 ID와 제안자 ID로 대기 중인 제안 조회
     * - 동일 게시글에 중복 제안 방지용
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
}
