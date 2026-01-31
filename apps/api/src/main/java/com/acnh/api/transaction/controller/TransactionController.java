package com.acnh.api.transaction.controller;

import com.acnh.api.transaction.dto.TransactionCreateRequest;
import com.acnh.api.transaction.dto.TransactionListResponse;
import com.acnh.api.transaction.dto.TransactionResponse;
import com.acnh.api.transaction.dto.TransactionSummaryResponse;
import com.acnh.api.transaction.enums.TransactionType;
import com.acnh.api.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;

/**
 * 거래 내역(가계부) API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    private static final int DEFAULT_PAGE_SIZE = 20;

    /**
     * 거래 내역 목록 조회
     * GET /api/transactions
     */
    @GetMapping
    public ResponseEntity<?> getTransactions(
            @AuthenticationPrincipal String visitorId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("거래 내역 조회 요청 - visitorId: {}, startDate: {}, endDate: {}, type: {}",
                visitorId, startDate, endDate, type);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            // 날짜 파싱
            LocalDateTime start = startDate != null
                    ? LocalDate.parse(startDate).atStartOfDay()
                    : null;
            LocalDateTime end = endDate != null
                    ? LocalDate.parse(endDate).atTime(LocalTime.MAX)
                    : null;

            // 거래 유형 파싱
            TransactionType transactionType = null;
            if (type != null && !type.isEmpty()) {
                try {
                    transactionType = TransactionType.valueOf(type);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "INVALID_TYPE",
                            "message", "유효하지 않은 거래 유형입니다"
                    ));
                }
            }

            Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
            TransactionListResponse response = transactionService.getTransactions(
                    visitorId, start, end, transactionType, pageable);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 거래 통계 조회
     * GET /api/transactions/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
            @AuthenticationPrincipal String visitorId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        log.info("거래 통계 조회 요청 - visitorId: {}, startDate: {}, endDate: {}",
                visitorId, startDate, endDate);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            // 날짜 파싱
            LocalDateTime start = startDate != null
                    ? LocalDate.parse(startDate).atStartOfDay()
                    : null;
            LocalDateTime end = endDate != null
                    ? LocalDate.parse(endDate).atTime(LocalTime.MAX)
                    : null;

            TransactionSummaryResponse response = transactionService.getSummary(visitorId, start, end);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 거래 내역 생성
     * POST /api/transactions
     */
    @PostMapping
    public ResponseEntity<?> createTransaction(
            @AuthenticationPrincipal String visitorId,
            @Valid @RequestBody TransactionCreateRequest request) {

        log.info("거래 내역 생성 요청 - visitorId: {}, type: {}, amount: {}",
                visitorId, request.getType(), request.getAmount());

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            TransactionResponse response = transactionService.createTransaction(visitorId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_REQUEST",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 거래 내역 삭제
     * DELETE /api/transactions/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long id) {

        log.info("거래 내역 삭제 요청 - visitorId: {}, transactionId: {}", visitorId, id);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            transactionService.deleteTransaction(visitorId, id);
            return ResponseEntity.ok(Map.of("message", "거래 내역이 삭제되었습니다"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }
}
