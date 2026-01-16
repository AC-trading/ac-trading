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
     * 채팅방의 최신 메시지 1건 조회 (단일 채팅방용)
     * - 전체 목록 조회 대신 효율적으로 마지막 메시지만 조회
     */
    Optional<ChatMessage> findFirstByChatRoomIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long chatRoomId);

    /**
     * 채팅방별 마지막 메시지 일괄 조회
     * - chatRoomId 목록에 해당하는 각 채팅방의 최신 메시지 반환
     *
     * [PR Review 수정]
     * Before: MAX(createdAt) 사용 - 타임스탬프 중복 시 여러 행 반환 가능
     * After: MAX(id) 사용 - 채팅방당 정확히 1행만 반환 보장
     * 이유: 동시에 생성된 메시지의 중복 반환 방지
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.deletedAt IS NULL " +
            "AND m.chatRoomId IN :chatRoomIds " +
            "AND m.id IN (SELECT MAX(m2.id) FROM ChatMessage m2 " +
            "WHERE m2.deletedAt IS NULL AND m2.chatRoomId IN :chatRoomIds " +
            "GROUP BY m2.chatRoomId)")
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
