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

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
        PostListResponse response = likeService.getMyLikes(visitorId, pageable);
        return ResponseEntity.ok(response);
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

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        // 이미 찜한 경우 InvalidRequestException(400) 반환
        LikeResponse response = likeService.likePost(postId, visitorId);
        return ResponseEntity.ok(response);
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

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        // 찜하지 않은 경우 InvalidRequestException(400) 반환
        LikeResponse response = likeService.unlikePost(postId, visitorId);
        return ResponseEntity.ok(response);
    }
}
