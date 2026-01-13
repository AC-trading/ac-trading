package com.acnh.api.chat.repository;

import com.acnh.api.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 채팅 메시지 Repository
 */
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * ID로 삭제되지 않은 메시지 조회
     */
    Optional<ChatMessage> findByIdAndDeletedAtIsNull(Long id);

    /**
     * 채팅방 ID로 삭제되지 않은 메시지 목록 조회 (생성일 오름차순)
     */
    List<ChatMessage> findByChatRoomIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long chatRoomId);

    /**
     * 채팅방 ID로 삭제되지 않은 메시지 페이징 조회
     */
    Page<ChatMessage> findByChatRoomIdAndDeletedAtIsNull(Long chatRoomId, Pageable pageable);

    /**
     * 채팅방 ID로 읽지 않은 메시지 목록 조회
     */
    List<ChatMessage> findByChatRoomIdAndIsReadFalseAndDeletedAtIsNull(Long chatRoomId);

    /**
     * 채팅방 ID와 발신자 ID가 아닌 읽지 않은 메시지 수 조회
     */
    long countByChatRoomIdAndSenderIdNotAndIsReadFalseAndDeletedAtIsNull(Long chatRoomId, Long senderId);
}
