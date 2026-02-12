package com.acnh.api.post.repository;

import com.acnh.api.post.entity.PostLike;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 게시글 찜 Repository
 */
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    /**
     * 게시글 ID와 사용자 ID로 삭제되지 않은 찜 조회
     */
    Optional<PostLike> findByPostIdAndUserIdAndDeletedAtIsNull(Long postId, Long userId);

    /**
     * 게시글 ID와 사용자 ID로 찜 존재 여부 확인
     */
    boolean existsByPostIdAndUserIdAndDeletedAtIsNull(Long postId, Long userId);

    /**
     * 사용자 ID로 삭제되지 않은 찜 목록 페이징 조회
     */
    Page<PostLike> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);

    /**
     * 게시글 ID의 삭제되지 않은 찜 수 조회
     */
    long countByPostIdAndDeletedAtIsNull(Long postId);
}
