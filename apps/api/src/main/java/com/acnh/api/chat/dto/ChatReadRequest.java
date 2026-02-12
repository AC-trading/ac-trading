package com.acnh.api.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채팅 읽음 처리 요청 DTO (STOMP용)
 */
@Getter
@NoArgsConstructor
public class ChatReadRequest {

    @NotNull(message = "채팅방 ID는 필수입니다")
    private Long chatRoomId;
}
