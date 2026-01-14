package com.acnh.api.chat.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채팅 메시지 Entity
 * - chat_messages 테이블 매핑
 */
@Entity
@Table(name = "chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_room_id", nullable = false)
    private Long chatRoomId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "message_type", nullable = false, length = 20)
    private String messageType;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    @Builder
    public ChatMessage(Long chatRoomId, Long senderId, String messageType,
                       String content, String imageUrl) {
        this.chatRoomId = chatRoomId;
        this.senderId = senderId;
        this.messageType = messageType != null ? messageType : "TEXT";
        this.content = content;
        this.imageUrl = imageUrl;
        this.isRead = false;
    }

    /**
     * 읽음 처리
     */
    public void markAsRead() {
        this.isRead = true;
    }
}
