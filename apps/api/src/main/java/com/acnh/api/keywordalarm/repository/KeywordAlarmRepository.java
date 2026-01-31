package com.acnh.api.keywordalarm.repository;

import com.acnh.api.keywordalarm.entity.KeywordAlarm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 키워드 알림 리포지토리
 */
@Repository
public interface KeywordAlarmRepository extends JpaRepository<KeywordAlarm, Long> {

    /**
     * 사용자의 키워드 목록 조회 (삭제되지 않은 것만)
     */
    List<KeywordAlarm> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    /**
     * 특정 키워드 조회 (사용자별, 삭제되지 않은 것)
     */
    Optional<KeywordAlarm> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    /**
     * 중복 키워드 체크 (대소문자 구분 없이)
     */
    @Query("SELECT COUNT(k) > 0 FROM KeywordAlarm k WHERE k.userId = :userId " +
           "AND LOWER(k.keyword) = LOWER(:keyword) AND k.deletedAt IS NULL")
    boolean existsByUserIdAndKeywordIgnoreCaseAndDeletedAtIsNull(
            @Param("userId") Long userId,
            @Param("keyword") String keyword);

    /**
     * 새 게시글의 아이템명과 매칭되는 키워드를 가진 사용자 ID 목록 조회
     * - 게시글 작성자 본인은 제외
     * - LIKE 검색으로 키워드 매칭
     */
    @Query("SELECT DISTINCT k.userId FROM KeywordAlarm k " +
           "WHERE k.deletedAt IS NULL AND k.userId != :authorId " +
           "AND LOWER(:itemName) LIKE CONCAT('%', LOWER(k.keyword), '%')")
    List<Long> findUserIdsByMatchingKeyword(
            @Param("itemName") String itemName,
            @Param("authorId") Long authorId);

    /**
     * 사용자의 키워드 개수 조회
     */
    long countByUserIdAndDeletedAtIsNull(Long userId);

    /**
     * 삭제된 키워드 조회 (복구용)
     * - soft delete된 키워드를 찾아서 복구할 때 사용
     * - CodeRabbit 리뷰 반영: soft delete와 unique 제약 조건 충돌 해결
     */
    @Query("SELECT k FROM KeywordAlarm k WHERE k.userId = :userId " +
           "AND LOWER(k.keyword) = LOWER(:keyword) AND k.deletedAt IS NOT NULL")
    Optional<KeywordAlarm> findDeletedByUserIdAndKeywordIgnoreCase(
            @Param("userId") Long userId,
            @Param("keyword") String keyword);
}
