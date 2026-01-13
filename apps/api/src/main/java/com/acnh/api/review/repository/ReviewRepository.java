package com.acnh.api.review.repository;

import com.acnh.api.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 리뷰 Repository
 */
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * ID로 삭제되지 않은 리뷰 조회
     */
    Optional<Review> findByIdAndDeletedAtIsNull(Long id);

    /**
     * 게시글 ID와 리뷰어 ID로 삭제되지 않은 리뷰 조회
     */
    Optional<Review> findByPostIdAndReviewerIdAndDeletedAtIsNull(Long postId, Long reviewerId);

    /**
     * 리뷰 대상자 ID로 삭제되지 않은 리뷰 페이징 조회
     */
    Page<Review> findByRevieweeIdAndDeletedAtIsNull(Long revieweeId, Pageable pageable);

    /**
     * 리뷰어 ID로 삭제되지 않은 리뷰 페이징 조회
     */
    Page<Review> findByReviewerIdAndDeletedAtIsNull(Long reviewerId, Pageable pageable);

    /**
     * 게시글 ID와 리뷰어 ID로 리뷰 존재 여부 확인
     */
    boolean existsByPostIdAndReviewerIdAndDeletedAtIsNull(Long postId, Long reviewerId);

    /**
     * 리뷰 대상자의 평균 별점 계산
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.revieweeId = :revieweeId AND r.deletedAt IS NULL")
    Double calculateAverageRatingByRevieweeId(@Param("revieweeId") Long revieweeId);

    /**
     * 리뷰 대상자의 삭제되지 않은 리뷰 수 조회
     */
    long countByRevieweeIdAndDeletedAtIsNull(Long revieweeId);
}
