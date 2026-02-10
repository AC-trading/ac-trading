package com.acnh.api.chat.dto;

import com.acnh.api.chat.entity.ChatRoom;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String postImageUrl;
    private Integer postPrice;
    private String postCurrencyType;
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

    // Before: Lombok @Getter + boolean isPostOwner → Jackson이 "postOwner"로 직렬화 (is 접두사 제거)
    // After: @JsonProperty로 명시적 키 지정 → 프론트엔드 기대값 "isPostOwner"와 일치
    @JsonProperty("isPostOwner")
    private boolean isPostOwner;

    /**
     * Entity -> DTO 변환
     */
    public static ChatRoomResponse from(ChatRoom chatRoom, Long currentUserId,
                                         String postItemName, String postImageUrl, Integer postPrice, String postCurrencyType, String postStatus,
                                         String otherUserNickname, String otherUserIslandName,
                                         String lastMessage, LocalDateTime lastMessageAt,
                                         Integer unreadCount) {
        // Before: getPostOwnerId().equals(currentUserId) 중복 호출
        // After: isPostOwner 먼저 판별하여 otherUserId 결정에 재사용
        boolean isPostOwner = chatRoom.getPostOwnerId().equals(currentUserId);
        Long otherUserId = isPostOwner
                ? chatRoom.getApplicantId()
                : chatRoom.getPostOwnerId();

        return ChatRoomResponse.builder()
                .id(chatRoom.getId())
                .postId(chatRoom.getPostId())
                .postItemName(postItemName)
                .postImageUrl(postImageUrl)
                .postPrice(postPrice)
                .postCurrencyType(postCurrencyType)
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
                .isPostOwner(isPostOwner)
                .build();
    }
}
