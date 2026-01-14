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

    /**
     * 피드 조회 - bumped_at 우선 정렬 (끌올 우선, 없으면 created_at)
     * - 필터: 카테고리, 게시글유형, 상태, 화폐유형, 가격범위
     * - 가격 필터는 화폐유형(currencyType)과 함께 사용해야 함 (벨 500과 마일 500은 다름)
     */
    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL " +
            "AND (:categoryId IS NULL OR p.categoryId = :categoryId) " +
            "AND (:postType IS NULL OR p.postType = :postType) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:currencyType IS NULL OR p.currencyType = :currencyType) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
            "ORDER BY COALESCE(p.bumpedAt, p.createdAt) DESC")
    Page<Post> findFeed(
            @Param("categoryId") Long categoryId,
            @Param("postType") String postType,
            @Param("status") String status,
            @Param("currencyType") String currencyType,
            @Param("minPrice") Integer minPrice,
            @Param("maxPrice") Integer maxPrice,
            Pageable pageable);

    /**
     * 아이템명 검색 (LIKE 검색, 띄어쓰기 무시)
     * - 필터: 카테고리, 게시글유형, 상태, 화폐유형, 가격범위
     * - 검색어와 아이템명 모두 공백 제거 후 비교
     * - 가격 필터는 화폐유형(currencyType)과 함께 사용해야 함 (벨 500과 마일 500은 다름)
     */
    @Query(value = "SELECT * FROM posts p WHERE p.deleted_at IS NULL " +
            "AND LOWER(REPLACE(p.item_name, ' ', '')) LIKE LOWER(CONCAT('%', REPLACE(:keyword, ' ', ''), '%')) " +
            "AND (:categoryId IS NULL OR p.category_id = :categoryId) " +
            "AND (:postType IS NULL OR p.post_type = :postType) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:currencyType IS NULL OR p.currency_type = :currencyType) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
            "ORDER BY COALESCE(p.bumped_at, p.created_at) DESC",
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.deleted_at IS NULL " +
            "AND LOWER(REPLACE(p.item_name, ' ', '')) LIKE LOWER(CONCAT('%', REPLACE(:keyword, ' ', ''), '%')) " +
            "AND (:categoryId IS NULL OR p.category_id = :categoryId) " +
            "AND (:postType IS NULL OR p.post_type = :postType) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:currencyType IS NULL OR p.currency_type = :currencyType) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice)",
            nativeQuery = true)
    Page<Post> searchByKeyword(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("postType") String postType,
            @Param("status") String status,
            @Param("currencyType") String currencyType,
            @Param("minPrice") Integer minPrice,
            @Param("maxPrice") Integer maxPrice,
            Pageable pageable);

    /**
     * 내 게시글 목록 조회 (페이징, 최신순)
     */
    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL " +
            "AND p.userId = :userId " +
            "ORDER BY p.createdAt DESC")
    Page<Post> findMyPosts(@Param("userId") Long userId, Pageable pageable);
}
