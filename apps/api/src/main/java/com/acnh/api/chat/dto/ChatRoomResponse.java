package com.acnh.api.chat.dto;

import com.acnh.api.chat.entity.ChatRoom;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 채팅방 응답 DTO
 */
@Getter
@Builder
public class ChatRoomResponse {

    private Long id;
    private Long postId;
    private String postItemName;
    private String postStatus;

    private Long otherUserId;
    private String otherUserNickname;
    private String otherUserIslandName;

    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private Integer unreadCount;

    private String status;
    private LocalDateTime scheduledTradeAt;
    private LocalDateTime createdAt;

    /**
     * Entity -> DTO 변환
     */
    public static ChatRoomResponse from(ChatRoom chatRoom, Long currentUserId,
                                         String postItemName, String postStatus,
                                         String otherUserNickname, String otherUserIslandName,
                                         String lastMessage, LocalDateTime lastMessageAt,
                                         Integer unreadCount) {
        // 상대방 ID 결정 (내가 postOwner면 상대방은 applicant, 반대면 postOwner)
        Long otherUserId = chatRoom.getPostOwnerId().equals(currentUserId)
                ? chatRoom.getApplicantId()
                : chatRoom.getPostOwnerId();

        return ChatRoomResponse.builder()
                .id(chatRoom.getId())
                .postId(chatRoom.getPostId())
                .postItemName(postItemName)
                .postStatus(postStatus)
                .otherUserId(otherUserId)
                .otherUserNickname(otherUserNickname)
                .otherUserIslandName(otherUserIslandName)
                .lastMessage(lastMessage)
                .lastMessageAt(lastMessageAt)
                .unreadCount(unreadCount)
                .status(chatRoom.getStatus())
                .scheduledTradeAt(chatRoom.getScheduledTradeAt())
                .createdAt(chatRoom.getCreatedAt())
                .build();
    }
}
