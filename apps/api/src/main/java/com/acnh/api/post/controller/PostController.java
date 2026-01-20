package com.acnh.api.post.controller;

import com.acnh.api.chat.dto.ChatRoomResponse;
import com.acnh.api.chat.service.ChatService;
import com.acnh.api.post.dto.*;
import com.acnh.api.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 게시글 관련 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final ChatService chatService;

    private static final int DEFAULT_PAGE_SIZE = 20;

    /**
     * 게시글 목록 조회 (피드)
     * GET /api/posts
     * - 필터: categoryId, postType, status, currencyType, minPrice, maxPrice
     * - 가격 필터 사용 시 currencyType 필수 (벨 500과 마일 500은 다름)
     * - 페이징: page, size
     */
    @GetMapping
    public ResponseEntity<?> getFeed(
            @AuthenticationPrincipal String visitorId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String postType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String currencyType,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("피드 조회 요청 - categoryId: {}, postType: {}, status: {}, currencyType: {}, minPrice: {}, maxPrice: {}, page: {}, size: {}",
                categoryId, postType, status, currencyType, minPrice, maxPrice, page, size);

        try {
            Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
            PostListResponse response = postService.getFeed(categoryId, postType, status, currencyType, minPrice, maxPrice, visitorId, pageable);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_REQUEST",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 게시글 검색
     * GET /api/posts/search
     * - 필수: keyword
     * - 필터: categoryId, postType, status, currencyType, minPrice, maxPrice
     * - 가격 필터 사용 시 currencyType 필수 (벨 500과 마일 500은 다름)
     * - 페이징: page, size
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchPosts(
            @AuthenticationPrincipal String visitorId,
            @RequestParam String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String postType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String currencyType,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("검색 요청 - keyword: {}, categoryId: {}, postType: {}, status: {}, currencyType: {}, minPrice: {}, maxPrice: {}, page: {}, size: {}",
                keyword, categoryId, postType, status, currencyType, minPrice, maxPrice, page, size);

        try {
            Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
            PostListResponse response = postService.searchPosts(keyword, categoryId, postType, status, currencyType, minPrice, maxPrice, visitorId, pageable);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_REQUEST",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 내 게시글 목록 조회
     * GET /api/posts/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyPosts(
            @AuthenticationPrincipal String visitorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("내 게시글 조회 요청 - visitorId: {}", visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
            PostListResponse response = postService.getMyPosts(visitorId, pageable);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 게시글 상세 조회
     * GET /api/posts/{postId}
     */
    @GetMapping("/{postId}")
    public ResponseEntity<?> getPost(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId) {

        log.info("게시글 상세 조회 요청 - postId: {}", postId);

        try {
            PostResponse response = postService.getPost(postId, visitorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "POST_NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 게시글 작성
     * POST /api/posts
     */
    @PostMapping
    public ResponseEntity<?> createPost(
            @AuthenticationPrincipal String visitorId,
            @Valid @RequestBody PostCreateRequest request) {

        log.info("게시글 작성 요청 - visitorId: {}", visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            PostResponse response = postService.createPost(request, visitorId);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_REQUEST",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 게시글 수정
     * POST /api/posts/{postId}/update
     */
    @PostMapping("/{postId}/update")
    public ResponseEntity<?> updatePost(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequest request) {

        log.info("게시글 수정 요청 - postId: {}, visitorId: {}", postId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            PostResponse response = postService.updatePost(postId, request, visitorId);
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
     * 게시글 삭제 (soft delete)
     * POST /api/posts/{postId}/delete
     */
    @PostMapping("/{postId}/delete")
    public ResponseEntity<?> deletePost(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId) {

        log.info("게시글 삭제 요청 - postId: {}, visitorId: {}", postId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            postService.deletePost(postId, visitorId);
            return ResponseEntity.ok(Map.of("message", "게시글이 삭제되었습니다"));
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("존재하지 않는")) {
                return ResponseEntity.status(404).body(Map.of(
                        "error", "POST_NOT_FOUND",
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
     * 게시글 상태 변경
     * POST /api/posts/{postId}/status
     */
    @PostMapping("/{postId}/status")
    public ResponseEntity<?> updatePostStatus(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId,
            @Valid @RequestBody PostStatusUpdateRequest request) {

        log.info("게시글 상태 변경 요청 - postId: {}, status: {}, visitorId: {}", postId, request.getStatus(), visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            PostResponse response = postService.updatePostStatus(postId, request, visitorId);
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
     * 게시글 끌어올리기
     * POST /api/posts/{postId}/bump
     * - 마지막 끌올/생성 후 72시간(3일) 이후에만 가능
     */
    @PostMapping("/{postId}/bump")
    public ResponseEntity<?> bumpPost(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId) {

        log.info("게시글 끌어올리기 요청 - postId: {}, visitorId: {}", postId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            PostResponse response = postService.bumpPost(postId, visitorId);
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
            // 끌어올리기 제한 에러
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "BUMP_LIMIT_EXCEEDED",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 게시글별 채팅방 목록 조회 (작성자용)
     * GET /api/posts/{postId}/chat-rooms
     * - 게시글 작성자만 조회 가능
     */
    @GetMapping("/{postId}/chat-rooms")
    public ResponseEntity<?> getChatRoomsByPostId(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId) {

        log.info("게시글별 채팅방 목록 조회 요청 - postId: {}, visitorId: {}", postId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            List<ChatRoomResponse> response = chatService.getChatRoomsByPostId(postId, visitorId);
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
