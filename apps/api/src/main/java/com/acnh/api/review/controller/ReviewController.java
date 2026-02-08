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
     * 내가 받은 리뷰 목록 조회
     * GET /api/users/me/reviews
     */
    @GetMapping("/users/me/reviews")
    public ResponseEntity<?> getMyReviews(
            @AuthenticationPrincipal String visitorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("내 리뷰 목록 조회 요청 - visitorId: {}", visitorId);

        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
        ReviewListResponse response = reviewService.getMyReviews(visitorId, pageable);
        return ResponseEntity.ok(response);
    }

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

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
        ReviewListResponse response = reviewService.getReviewsByUserId(userId, pageable);
        return ResponseEntity.ok(response);
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

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        ReviewResponse response = reviewService.createReview(request, visitorId);
        return ResponseEntity.status(201).body(response);
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
