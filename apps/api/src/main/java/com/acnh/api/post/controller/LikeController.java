package com.acnh.api.post.controller;

import com.acnh.api.post.dto.LikeResponse;
import com.acnh.api.post.dto.PostListResponse;
import com.acnh.api.post.service.LikeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 찜(좋아요) 관련 API 컨트롤러
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    private static final int DEFAULT_PAGE_SIZE = 20;

    /**
     * 내 찜 목록 조회
     * GET /api/likes
     */
    @GetMapping("/api/likes")
    public ResponseEntity<?> getMyLikes(
            @AuthenticationPrincipal String visitorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("내 찜 목록 조회 요청 - visitorId: {}, page: {}, size: {}", visitorId, page, size);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
            PostListResponse response = likeService.getMyLikes(visitorId, pageable);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 게시글 찜하기
     * POST /api/posts/{postId}/like
     */
    @PostMapping("/api/posts/{postId}/like")
    public ResponseEntity<?> likePost(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId) {

        log.info("게시글 찜하기 요청 - postId: {}, visitorId: {}", postId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            LikeResponse response = likeService.likePost(postId, visitorId);
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
        } catch (IllegalStateException e) {
            // 이미 찜한 경우
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "ALREADY_LIKED",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 게시글 찜 취소
     * POST /api/posts/{postId}/unlike
     */
    @PostMapping("/api/posts/{postId}/unlike")
    public ResponseEntity<?> unlikePost(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId) {

        log.info("게시글 찜 취소 요청 - postId: {}, visitorId: {}", postId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            LikeResponse response = likeService.unlikePost(postId, visitorId);
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
        } catch (IllegalStateException e) {
            // 찜하지 않은 경우
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "NOT_LIKED",
                    "message", e.getMessage()
            ));
        }
    }
}
