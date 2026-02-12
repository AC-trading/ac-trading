package com.acnh.api.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채팅방 생성 요청 DTO
 */
@Getter
@NoArgsConstructor
public class ChatRoomCreateRequest {

    @NotNull(message = "게시글 ID는 필수입니다")
    private Long postId;
}
