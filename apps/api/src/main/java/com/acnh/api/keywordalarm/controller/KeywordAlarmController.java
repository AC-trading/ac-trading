package com.acnh.api.keywordalarm.controller;

import com.acnh.api.keywordalarm.dto.KeywordAlarmCreateRequest;
import com.acnh.api.keywordalarm.dto.KeywordAlarmListResponse;
import com.acnh.api.keywordalarm.dto.KeywordAlarmResponse;
import com.acnh.api.keywordalarm.service.KeywordAlarmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 키워드 알림 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/keyword-alarms")
@RequiredArgsConstructor
public class KeywordAlarmController {

    private final KeywordAlarmService keywordAlarmService;

    /**
     * 내 키워드 목록 조회
     * GET /api/keyword-alarms
     */
    @GetMapping
    public ResponseEntity<?> getMyKeywords(@AuthenticationPrincipal String visitorId) {
        log.info("키워드 목록 조회 요청 - visitorId: {}", visitorId);

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            KeywordAlarmListResponse response = keywordAlarmService.getMyKeywords(visitorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 키워드 추가
     * POST /api/keyword-alarms
     */
    @PostMapping
    public ResponseEntity<?> createKeyword(
            @AuthenticationPrincipal String visitorId,
            @Valid @RequestBody KeywordAlarmCreateRequest request) {

        log.info("키워드 추가 요청 - visitorId: {}, keyword: {}", visitorId, request.getKeyword());

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            KeywordAlarmResponse response = keywordAlarmService.createKeyword(visitorId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_REQUEST",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 키워드 삭제
     * DELETE /api/keyword-alarms/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteKeyword(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long id) {

        log.info("키워드 삭제 요청 - visitorId: {}, keywordId: {}", visitorId, id);

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            keywordAlarmService.deleteKeyword(visitorId, id);
            return ResponseEntity.ok(Map.of("message", "키워드가 삭제되었습니다"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }
}
