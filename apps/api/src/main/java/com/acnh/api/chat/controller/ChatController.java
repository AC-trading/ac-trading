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

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        ChatRoomResponse response = chatService.createOrGetChatRoom(request, visitorId);
        return ResponseEntity.ok(response);
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
        ChatRoomListResponse response = chatService.getMyChatRooms(visitorId, pageable);
        return ResponseEntity.ok(response);
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

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        ChatRoomResponse response = chatService.getChatRoom(roomId, visitorId);
        return ResponseEntity.ok(response);
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

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        List<ChatMessageResponse> response = chatService.getMessages(roomId, visitorId);
        return ResponseEntity.ok(response);
    }

    /**
     * 예약자 지정
     * POST /api/chat/rooms/{roomId}/reserve
     */
    @PostMapping("/{roomId}/reserve")
    public ResponseEntity<?> reserveChatRoom(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long roomId,
            @RequestBody(required = false) ReserveRequest request) {

        log.info("예약자 지정 요청 - roomId: {}, visitorId: {}", roomId, visitorId);

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        var scheduledAt = request != null ? request.getScheduledTradeAt() : null;
        ChatRoomResponse response = chatService.reserveChatRoom(roomId, visitorId, scheduledAt);
        return ResponseEntity.ok(response);
    }

    /**
     * 예약 해제
     * POST /api/chat/rooms/{roomId}/unreserve
     */
    @PostMapping("/{roomId}/unreserve")
    public ResponseEntity<?> unreserveChatRoom(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long roomId) {

        log.info("예약 해제 요청 - roomId: {}, visitorId: {}", roomId, visitorId);

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        ChatRoomResponse response = chatService.unreserveChatRoom(roomId, visitorId);
        return ResponseEntity.ok(response);
    }

    /**
     * 거래 완료 처리
     * POST /api/chat/rooms/{roomId}/complete
     */
    @PostMapping("/{roomId}/complete")
    public ResponseEntity<?> completeTrade(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long roomId) {

        log.info("거래 완료 요청 - roomId: {}, visitorId: {}", roomId, visitorId);

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        ChatRoomResponse response = chatService.completeTrade(roomId, visitorId);
        return ResponseEntity.ok(response);
    }

    /**
     * 채팅방 나가기
     * POST /api/chat/rooms/{roomId}/leave
     */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<?> leaveChatRoom(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long roomId) {

        log.info("채팅방 나가기 요청 - roomId: {}, visitorId: {}", roomId, visitorId);

        // Before: visitorId == null만 체크
        // After: "anonymousUser"도 비인증 상태로 처리 (Spring Security 기본값)
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        // GlobalExceptionHandler가 NotFoundException/InvalidRequestException 처리
        chatService.leaveChatRoom(roomId, visitorId);
        return ResponseEntity.ok(Map.of(
                "message", "채팅방을 나갔습니다"
        ));
    }
}
