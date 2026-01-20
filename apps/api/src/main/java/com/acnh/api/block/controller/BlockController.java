package com.acnh.api.block.controller;

import com.acnh.api.block.dto.BlockListResponse;
import com.acnh.api.block.dto.BlockRequest;
import com.acnh.api.block.dto.BlockResponse;
import com.acnh.api.block.service.BlockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 차단 관련 API 컨트롤러
 * Base Path: /api/blocks
 */
@Slf4j
@RestController
@RequestMapping("/api/blocks")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;

    /**
     * 사용자 차단
     * POST /api/blocks
     */
    @PostMapping
    public ResponseEntity<?> blockUser(
            @AuthenticationPrincipal String visitorId,
            @Valid @RequestBody BlockRequest request) {

        log.info("차단 요청 - blockedUserId: {}, visitorId: {}", request.getBlockedUserId(), visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            BlockResponse response = blockService.blockUser(request, visitorId);
            return ResponseEntity.status(201).body(response);
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

    /**
     * 차단 해제
     * DELETE /api/blocks/{blockedUserId}
     */
    @DeleteMapping("/{blockedUserId}")
    public ResponseEntity<?> unblockUser(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long blockedUserId) {

        log.info("차단 해제 요청 - blockedUserId: {}, visitorId: {}", blockedUserId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            blockService.unblockUser(blockedUserId, visitorId);
            return ResponseEntity.ok(Map.of(
                    "message", "차단이 해제되었습니다"
            ));
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("존재하지 않는") || e.getMessage().contains("차단 내역")) {
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

    /**
     * 내가 차단한 사용자 목록 조회
     * GET /api/blocks
     */
    @GetMapping
    public ResponseEntity<?> getBlockedUsers(
            @AuthenticationPrincipal String visitorId) {

        log.info("차단 목록 조회 요청 - visitorId: {}", visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            BlockListResponse response = blockService.getBlockedUsers(visitorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }
}
