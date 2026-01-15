package com.acnh.api.chat.controller;

import com.acnh.api.chat.dto.ChatMessageRequest;
import com.acnh.api.chat.dto.ChatMessageResponse;
import com.acnh.api.chat.dto.ChatReadRequest;
import com.acnh.api.chat.service.ChatService;
import com.acnh.api.member.entity.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * 채팅 STOMP 메시지 컨트롤러
 * - 실시간 메시지 전송/수신
 * - 읽음 처리
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 메시지 전송
     * Client -> /app/chat.send
     * Server -> /topic/chat.{roomId}
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request,
                            SimpMessageHeaderAccessor headerAccessor) {

        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            log.warn("인증되지 않은 사용자의 메시지 전송 시도");
            return;
        }

        try {
            // principal.getName()은 JWT에서 추출한 UUID
            String visitorId = principal.getName();
            Member member = chatService.getMemberByUuid(visitorId);

            // 메시지 저장
            ChatMessageResponse response = chatService.saveMessage(request, member.getId());

            // 해당 채팅방 구독자들에게 브로드캐스트
            messagingTemplate.convertAndSend(
                    "/topic/chat." + request.getChatRoomId(),
                    response
            );

            log.info("메시지 브로드캐스트 완료 - roomId: {}, senderId: {}",
                    request.getChatRoomId(), member.getId());

        } catch (Exception e) {
            log.error("메시지 전송 실패 - error: {}", e.getMessage());
        }
    }

    /**
     * 메시지 읽음 처리
     * Client -> /app/chat.read
     * Server -> /topic/chat.{roomId}.read
     */
    @MessageMapping("/chat.read")
    public void markAsRead(@Payload ChatReadRequest request,
                           SimpMessageHeaderAccessor headerAccessor) {

        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            log.warn("인증되지 않은 사용자의 읽음 처리 시도");
            return;
        }

        try {
            String visitorId = principal.getName();
            Member member = chatService.getMemberByUuid(visitorId);

            // 읽음 처리
            chatService.markMessagesAsRead(request.getChatRoomId(), member.getId());

            // 상대방에게 읽음 알림 전송
            messagingTemplate.convertAndSend(
                    "/topic/chat." + request.getChatRoomId() + ".read",
                    member.getId()
            );

            log.info("읽음 처리 브로드캐스트 완료 - roomId: {}, userId: {}",
                    request.getChatRoomId(), member.getId());

        } catch (Exception e) {
            log.error("읽음 처리 실패 - error: {}", e.getMessage());
        }
    }
}
