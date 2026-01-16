package com.acnh.api.chat.controller;

import com.acnh.api.chat.dto.*;
import com.acnh.api.chat.service.ChatService;
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
 * 채팅 REST API 컨트롤러
 * Base Path: /api/chat/rooms
 * - 채팅방 CRUD
 * - 이전 메시지 조회
 */
@Slf4j
@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    private static final int DEFAULT_PAGE_SIZE = 20;

    /**
     * 채팅방 생성 또는 기존 채팅방 반환
     * POST /api/chat/rooms
     */
    @PostMapping
    public ResponseEntity<?> createChatRoom(
            @AuthenticationPrincipal String visitorId,
            @Valid @RequestBody ChatRoomCreateRequest request) {

        log.info("채팅방 생성 요청 - postId: {}, visitorId: {}", request.getPostId(), visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            ChatRoomResponse response = chatService.createOrGetChatRoom(request, visitorId);
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
     * 내 채팅방 목록 조회
     * GET /api/chat/rooms
     */
    @GetMapping
    public ResponseEntity<?> getMyChatRooms(
            @AuthenticationPrincipal String visitorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("채팅방 목록 조회 요청 - visitorId: {}, page: {}, size: {}", visitorId, page, size);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            Pageable pageable = PageRequest.of(page, Math.min(size, DEFAULT_PAGE_SIZE));
            ChatRoomListResponse response = chatService.getMyChatRooms(visitorId, pageable);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "NOT_FOUND",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 채팅방 상세 조회
     * GET /api/chat/rooms/{roomId}
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<?> getChatRoom(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long roomId) {

        log.info("채팅방 상세 조회 요청 - roomId: {}, visitorId: {}", roomId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            ChatRoomResponse response = chatService.getChatRoom(roomId, visitorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("존재하지 않는") || e.getMessage().contains("접근 권한")) {
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
     * 채팅 메시지 목록 조회 (이전 메시지)
     * GET /api/chat/rooms/{roomId}/messages
     */
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<?> getMessages(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long roomId) {

        log.info("메시지 목록 조회 요청 - roomId: {}, visitorId: {}", roomId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            List<ChatMessageResponse> response = chatService.getMessages(roomId, visitorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("존재하지 않는") || e.getMessage().contains("접근 권한")) {
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
