package com.acnh.api.post.repository;

import com.acnh.api.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
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
     * - 필터: 카테고리(다중), 게시글유형(다중), 상태, 화폐유형(다중), 가격범위
     * - 다중 필터: boolean 플래그 + IN 절 조합 (빈 리스트일 때 필터 스킵)
     * - 가격 필터는 화폐유형(currencyType)과 함께 사용해야 함 (벨 500과 마일 500은 다름)
     */
    @Query(value = "SELECT * FROM posts p WHERE p.deleted_at IS NULL " +
            "AND (:hasCategoryFilter = false OR p.category_id IN (:categoryIds)) " +
            "AND (:hasPostTypeFilter = false OR p.post_type IN (:postTypes)) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:hasCurrencyTypeFilter = false OR p.currency_type IN (:currencyTypes)) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
            "ORDER BY COALESCE(p.bumped_at, p.created_at) DESC",
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.deleted_at IS NULL " +
            "AND (:hasCategoryFilter = false OR p.category_id IN (:categoryIds)) " +
            "AND (:hasPostTypeFilter = false OR p.post_type IN (:postTypes)) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:hasCurrencyTypeFilter = false OR p.currency_type IN (:currencyTypes)) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice)",
            nativeQuery = true)
    Page<Post> findFeed(
            @Param("hasCategoryFilter") boolean hasCategoryFilter,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("hasPostTypeFilter") boolean hasPostTypeFilter,
            @Param("postTypes") List<String> postTypes,
            @Param("status") String status,
            @Param("hasCurrencyTypeFilter") boolean hasCurrencyTypeFilter,
            @Param("currencyTypes") List<String> currencyTypes,
            @Param("minPrice") Integer minPrice,
            @Param("maxPrice") Integer maxPrice,
            Pageable pageable);

    /**
     * 아이템명 + 설명 검색 (LIKE 검색, 띄어쓰기 무시)
     * Before: item_name만 검색 → "알바"로 검색 시 description에만 있는 키워드 누락
     * After: item_name OR description 모두 검색
     * - 필터: 카테고리(다중), 게시글유형(다중), 상태, 화폐유형(다중), 가격범위
     * - 다중 필터: boolean 플래그 + IN 절 조합 (빈 리스트일 때 필터 스킵)
     * - 가격 필터는 화폐유형(currencyType)과 함께 사용해야 함 (벨 500과 마일 500은 다름)
     */
    @Query(value = "SELECT * FROM posts p WHERE p.deleted_at IS NULL " +
            "AND (LOWER(REPLACE(p.item_name, ' ', '')) LIKE LOWER(CONCAT('%', REPLACE(:keyword, ' ', ''), '%')) " +
            "  OR LOWER(REPLACE(COALESCE(p.description, ''), ' ', '')) LIKE LOWER(CONCAT('%', REPLACE(:keyword, ' ', ''), '%'))) " +
            "AND (:hasCategoryFilter = false OR p.category_id IN (:categoryIds)) " +
            "AND (:hasPostTypeFilter = false OR p.post_type IN (:postTypes)) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:hasCurrencyTypeFilter = false OR p.currency_type IN (:currencyTypes)) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
            "ORDER BY COALESCE(p.bumped_at, p.created_at) DESC",
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.deleted_at IS NULL " +
            "AND (LOWER(REPLACE(p.item_name, ' ', '')) LIKE LOWER(CONCAT('%', REPLACE(:keyword, ' ', ''), '%')) " +
            "  OR LOWER(REPLACE(COALESCE(p.description, ''), ' ', '')) LIKE LOWER(CONCAT('%', REPLACE(:keyword, ' ', ''), '%'))) " +
            "AND (:hasCategoryFilter = false OR p.category_id IN (:categoryIds)) " +
            "AND (:hasPostTypeFilter = false OR p.post_type IN (:postTypes)) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:hasCurrencyTypeFilter = false OR p.currency_type IN (:currencyTypes)) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice)",
            nativeQuery = true)
    Page<Post> searchByKeyword(
            @Param("keyword") String keyword,
            @Param("hasCategoryFilter") boolean hasCategoryFilter,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("hasPostTypeFilter") boolean hasPostTypeFilter,
            @Param("postTypes") List<String> postTypes,
            @Param("status") String status,
            @Param("hasCurrencyTypeFilter") boolean hasCurrencyTypeFilter,
            @Param("currencyTypes") List<String> currencyTypes,
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

    /**
     * ID 목록으로 삭제되지 않은 게시글 일괄 조회
     */
    List<Post> findByIdInAndDeletedAtIsNull(Collection<Long> ids);
}
