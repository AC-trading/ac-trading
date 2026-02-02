package com.acnh.api.transaction.service;

import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.post.enums.CurrencyType;
import com.acnh.api.transaction.dto.*;
import com.acnh.api.transaction.entity.Transaction;
import com.acnh.api.transaction.enums.TransactionType;
import com.acnh.api.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 거래 내역 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final MemberRepository memberRepository;

    /**
     * 거래 내역 목록 조회
     */
    public TransactionListResponse getTransactions(
            String visitorId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            TransactionType type,
            Pageable pageable) {

        Member member = findMemberByUuid(visitorId);

        Page<Transaction> transactionPage;

        if (type != null && startDate != null && endDate != null) {
            // 유형 + 기간 필터
            transactionPage = transactionRepository
                    .findByUserIdAndTypeAndTradedAtBetweenAndDeletedAtIsNullOrderByTradedAtDesc(
                            member.getId(), type, startDate, endDate, pageable);
        } else if (type != null) {
            // 유형 필터만
            transactionPage = transactionRepository
                    .findByUserIdAndTypeAndDeletedAtIsNullOrderByTradedAtDesc(
                            member.getId(), type, pageable);
        } else if (startDate != null && endDate != null) {
            // 기간 필터만
            transactionPage = transactionRepository
                    .findByUserIdAndTradedAtBetweenAndDeletedAtIsNullOrderByTradedAtDesc(
                            member.getId(), startDate, endDate, pageable);
        } else {
            // 필터 없음
            transactionPage = transactionRepository
                    .findByUserIdAndDeletedAtIsNullOrderByTradedAtDesc(member.getId(), pageable);
        }

        List<TransactionResponse> responses = transactionPage.getContent().stream()
                .map(TransactionResponse::from)
                .collect(Collectors.toList());

        Page<TransactionResponse> responsePage = new PageImpl<>(
                responses, pageable, transactionPage.getTotalElements());

        return TransactionListResponse.from(responsePage);
    }

    /**
     * 거래 통계 조회
     */
    public TransactionSummaryResponse getSummary(
            String visitorId,
            LocalDateTime startDate,
            LocalDateTime endDate) {

        Member member = findMemberByUuid(visitorId);

        long totalSales;
        long totalPurchases;
        long salesCount;
        long purchaseCount;

        if (startDate != null && endDate != null) {
            // 기간별 통계
            totalSales = transactionRepository.sumAmountByUserIdAndTypeAndPeriod(
                    member.getId(), TransactionType.SALE, startDate, endDate);
            totalPurchases = transactionRepository.sumAmountByUserIdAndTypeAndPeriod(
                    member.getId(), TransactionType.PURCHASE, startDate, endDate);
            salesCount = transactionRepository.countByUserIdAndTypeAndPeriod(
                    member.getId(), TransactionType.SALE, startDate, endDate);
            purchaseCount = transactionRepository.countByUserIdAndTypeAndPeriod(
                    member.getId(), TransactionType.PURCHASE, startDate, endDate);
        } else {
            // 전체 통계
            totalSales = transactionRepository.sumAmountByUserIdAndType(
                    member.getId(), TransactionType.SALE);
            totalPurchases = transactionRepository.sumAmountByUserIdAndType(
                    member.getId(), TransactionType.PURCHASE);
            salesCount = transactionRepository.countByUserIdAndTypeAndDeletedAtIsNull(
                    member.getId(), TransactionType.SALE);
            purchaseCount = transactionRepository.countByUserIdAndTypeAndDeletedAtIsNull(
                    member.getId(), TransactionType.PURCHASE);
        }

        return TransactionSummaryResponse.of(totalSales, totalPurchases, salesCount, purchaseCount);
    }

    /**
     * 거래 내역 생성
     */
    @Transactional
    public TransactionResponse createTransaction(String visitorId, TransactionCreateRequest request) {
        Member member = findMemberByUuid(visitorId);

        // 거래 유형 파싱
        TransactionType type;
        try {
            type = TransactionType.valueOf(request.getType());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 거래 유형입니다: " + request.getType());
        }

        // 화폐 종류 파싱
        CurrencyType currencyType;
        try {
            currencyType = CurrencyType.valueOf(request.getCurrencyType());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 화폐 종류입니다: " + request.getCurrencyType());
        }

        Transaction transaction = Transaction.builder()
                .userId(member.getId())
                .postId(request.getPostId())
                .itemName(request.getItemName())
                .type(type)
                .currencyType(currencyType)
                .amount(request.getAmount())
                .partnerNickname(request.getPartnerNickname())
                .memo(request.getMemo())
                .tradedAt(request.getTradedAt() != null ? request.getTradedAt() : LocalDateTime.now())
                .build();

        transactionRepository.save(transaction);

        log.info("거래 내역 생성 완료 - userId: {}, type: {}, amount: {}",
                member.getId(), type, request.getAmount());

        return TransactionResponse.from(transaction);
    }

    /**
     * 거래 내역 삭제
     */
    @Transactional
    public void deleteTransaction(String visitorId, Long transactionId) {
        Member member = findMemberByUuid(visitorId);

        Transaction transaction = transactionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(transactionId, member.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래 내역입니다"));

        transaction.delete();

        log.info("거래 내역 삭제 완료 - userId: {}, transactionId: {}", member.getId(), transactionId);
    }

    // ========== Private Helper Methods ==========

    /**
     * UUID로 회원 조회
     * - CodeRabbit 리뷰 반영: UUID 파싱 예외 처리 추가
     */
    private Member findMemberByUuid(String visitorId) {
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            throw new IllegalArgumentException("로그인이 필요합니다");
        }
        UUID uuid;
        try {
            uuid = UUID.fromString(visitorId);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 인증 정보입니다");
        }
        return memberRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }
}
