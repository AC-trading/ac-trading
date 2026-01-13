package com.acnh.api.post.repository;

import com.acnh.api.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
