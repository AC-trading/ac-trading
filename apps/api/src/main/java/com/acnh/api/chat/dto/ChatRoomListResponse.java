package com.acnh.api.chat.dto;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 채팅방 목록 응답 DTO
 */
@Getter
@Builder
public class ChatRoomListResponse {

    private List<ChatRoomResponse> chatRooms;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
    private boolean hasPrevious;

    public static ChatRoomListResponse from(Page<ChatRoomResponse> page) {
        return ChatRoomListResponse.builder()
                .chatRooms(page.getContent())
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
