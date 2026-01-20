package com.acnh.api.review.controller;

import com.acnh.api.review.dto.ReviewCreateRequest;
import com.acnh.api.review.dto.ReviewListResponse;
import com.acnh.api.review.dto.ReviewResponse;
import com.acnh.api.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 리뷰 관련 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    private static final int DEFAULT_PAGE_SIZE = 20;

    /**
     * 유저가 받은 리뷰 목록 조회
     * GET /api/users/{userId}/reviews
     */
    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<?> getReviewsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("유저 리뷰 목록 조회 요청 - userId: {}, page: {}, size: {}", userId, page, size);

        try {
            Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
            ReviewListResponse response = reviewService.getReviewsByUserId(userId, pageable);
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

    /**
     * 리뷰 작성
     * POST /api/reviews
     */
    @PostMapping("/reviews")
    public ResponseEntity<?> createReview(
            @AuthenticationPrincipal String visitorId,
            @Valid @RequestBody ReviewCreateRequest request) {

        log.info("리뷰 작성 요청 - visitorId: {}, postId: {}, revieweeId: {}",
                visitorId, request.getPostId(), request.getRevieweeId());

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            ReviewResponse response = reviewService.createReview(request, visitorId);
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
     * 리뷰 작성 가능 여부 확인
     * GET /api/posts/{postId}/can-review
     */
    @GetMapping("/posts/{postId}/can-review")
    public ResponseEntity<?> canWriteReview(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId) {

        log.info("리뷰 작성 가능 여부 확인 요청 - visitorId: {}, postId: {}", visitorId, postId);

        boolean canReview = reviewService.canWriteReview(postId, visitorId);
        return ResponseEntity.ok(Map.of("canReview", canReview));
    }
}
