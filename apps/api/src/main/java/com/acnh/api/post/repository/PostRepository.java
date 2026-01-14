package com.acnh.api.post.repository;

import com.acnh.api.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * 게시글 Repository
 */
public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * ID로 삭제되지 않은 게시글 조회
     */
    Optional<Post> findByIdAndDeletedAtIsNull(Long id);

    /**
     * 사용자 ID로 삭제되지 않은 게시글 목록 조회
     */
    List<Post> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    /**
     * 사용자 ID로 삭제되지 않은 게시글 페이징 조회
     */
    Page<Post> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);

    /**
     * 카테고리 ID로 삭제되지 않은 게시글 페이징 조회
     */
    Page<Post> findByCategoryIdAndDeletedAtIsNull(Long categoryId, Pageable pageable);

    /**
     * 상태로 삭제되지 않은 게시글 페이징 조회
     */
    Page<Post> findByStatusAndDeletedAtIsNull(String status, Pageable pageable);

    /**
     * 삭제되지 않은 모든 게시글 페이징 조회
     */
    Page<Post> findByDeletedAtIsNull(Pageable pageable);

    /**
     * 사용자 ID의 삭제되지 않은 게시글 수 조회
     */
    long countByUserIdAndDeletedAtIsNull(Long userId);

    /**
     * 좋아요 수 증가 (DB 레벨에서 원자적 처리)
     */
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :postId")
    int increaseLikeCount(@Param("postId") Long postId);

    /**
     * 좋아요 수 감소 (DB 레벨에서 원자적 처리, 0 미만 방지)
     */
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount - 1 WHERE p.id = :postId AND p.likeCount > 0")
    int decreaseLikeCount(@Param("postId") Long postId);
}
