package com.acnh.api.transaction.repository;

import com.acnh.api.transaction.entity.Transaction;
import com.acnh.api.transaction.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 거래 내역 리포지토리
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * 사용자의 거래 내역 전체 조회 (최신순)
     */
    Page<Transaction> findByUserIdAndDeletedAtIsNullOrderByTradedAtDesc(Long userId, Pageable pageable);

    /**
     * 사용자의 거래 내역 기간별 조회 (최신순)
     */
    Page<Transaction> findByUserIdAndTradedAtBetweenAndDeletedAtIsNullOrderByTradedAtDesc(
            Long userId, LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * 사용자의 특정 유형 거래 내역 조회 (최신순)
     */
    Page<Transaction> findByUserIdAndTypeAndDeletedAtIsNullOrderByTradedAtDesc(
            Long userId, TransactionType type, Pageable pageable);

    /**
     * 사용자의 특정 유형 거래 내역 기간별 조회 (최신순)
     */
    Page<Transaction> findByUserIdAndTypeAndTradedAtBetweenAndDeletedAtIsNullOrderByTradedAtDesc(
            Long userId, TransactionType type, LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * 특정 거래 내역 조회 (사용자 검증용)
     */
    Optional<Transaction> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    /**
     * 사용자의 특정 유형 총액 조회
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.userId = :userId AND t.type = :type AND t.deletedAt IS NULL")
    Long sumAmountByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);

    /**
     * 사용자의 특정 유형 총액 조회 (기간별)
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.userId = :userId AND t.type = :type " +
           "AND t.tradedAt BETWEEN :start AND :end AND t.deletedAt IS NULL")
    Long sumAmountByUserIdAndTypeAndPeriod(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * 사용자의 특정 유형 거래 건수 조회
     */
    long countByUserIdAndTypeAndDeletedAtIsNull(Long userId, TransactionType type);

    /**
     * 사용자의 특정 유형 거래 건수 조회 (기간별)
     */
    @Query("SELECT COUNT(t) FROM Transaction t " +
           "WHERE t.userId = :userId AND t.type = :type " +
           "AND t.tradedAt BETWEEN :start AND :end AND t.deletedAt IS NULL")
    long countByUserIdAndTypeAndPeriod(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
