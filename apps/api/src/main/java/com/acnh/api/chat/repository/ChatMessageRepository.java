package com.acnh.api.chat.repository;

import com.acnh.api.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
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

    /**
     * 채팅방별 마지막 메시지 일괄 조회
     * - chatRoomId 목록에 해당하는 각 채팅방의 최신 메시지 반환
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.deletedAt IS NULL " +
            "AND m.chatRoomId IN :chatRoomIds " +
            "AND m.createdAt = (SELECT MAX(m2.createdAt) FROM ChatMessage m2 " +
            "WHERE m2.chatRoomId = m.chatRoomId AND m2.deletedAt IS NULL)")
    List<ChatMessage> findLastMessagesByChatRoomIds(@Param("chatRoomIds") Collection<Long> chatRoomIds);

    /**
     * 채팅방별 읽지 않은 메시지 수 일괄 조회
     * - Object[]: [chatRoomId, count]
     */
    @Query("SELECT m.chatRoomId, COUNT(m) FROM ChatMessage m " +
            "WHERE m.deletedAt IS NULL AND m.chatRoomId IN :chatRoomIds " +
            "AND m.senderId <> :excludeSenderId AND m.isRead = false " +
            "GROUP BY m.chatRoomId")
    List<Object[]> countUnreadMessagesByChatRoomIds(
            @Param("chatRoomIds") Collection<Long> chatRoomIds,
            @Param("excludeSenderId") Long excludeSenderId);
}
