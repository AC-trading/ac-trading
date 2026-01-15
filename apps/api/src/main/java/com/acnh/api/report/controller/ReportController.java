package com.acnh.api.report.controller;

import com.acnh.api.report.dto.ReportCreateRequest;
import com.acnh.api.report.dto.ReportResponse;
import com.acnh.api.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 신고 관련 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * 신고하기
     * POST /api/reports
     */
    @PostMapping
    public ResponseEntity<?> createReport(
            @AuthenticationPrincipal String visitorId,
            @Valid @RequestBody ReportCreateRequest request) {

        log.info("신고 요청 - postId: {}, reasonCode: {}, visitorId: {}",
                request.getPostId(), request.getReasonCode(), visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            ReportResponse response = reportService.createReport(request, visitorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("존재하지 않는")) {
                return ResponseEntity.status(404).body(Map.of(
                        "error", "NOT_FOUND",
                        "message", e.getMessage()
                ));
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_REQUEST",
                    "message", e.getMessage()
            ));
        }
    }
}
