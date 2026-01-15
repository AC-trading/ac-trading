package com.acnh.api.chat.dto;

import com.acnh.api.chat.entity.ChatMessage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 채팅 메시지 응답 DTO
 */
@Getter
@Builder
public class ChatMessageResponse {

    private Long id;
    private Long chatRoomId;
    private Long senderId;
    private String senderNickname;
    private String messageType;
    private String content;
    private String imageUrl;
    private Boolean isRead;
    private LocalDateTime createdAt;

    /**
     * Entity -> DTO 변환
     */
    public static ChatMessageResponse from(ChatMessage message, String senderNickname) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .chatRoomId(message.getChatRoomId())
                .senderId(message.getSenderId())
                .senderNickname(senderNickname)
                .messageType(message.getMessageType())
                .content(message.getContent())
                .imageUrl(message.getImageUrl())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
