package com.acnh.api.chat.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채팅 메시지 전송 요청 DTO (STOMP용)
 */
@Getter
@NoArgsConstructor
public class ChatMessageRequest {

    @NotNull(message = "채팅방 ID는 필수입니다")
    private Long chatRoomId;

    // TEXT 또는 IMAGE
    private String messageType;

    @Size(max = 2000, message = "메시지는 2000자 이내로 입력해주세요")
    private String content;

    // 이미지 메시지일 경우 이미지 URL
    private String imageUrl;
}
