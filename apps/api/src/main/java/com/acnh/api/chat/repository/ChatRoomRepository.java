package com.acnh.api.chat.repository;

import com.acnh.api.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 채팅방 Repository
 */
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    /**
     * ID로 삭제되지 않은 채팅방 조회
     */
    Optional<ChatRoom> findByIdAndDeletedAtIsNull(Long id);

    /**
     * 게시글 ID와 신청자 ID로 삭제되지 않은 채팅방 조회
     */
    Optional<ChatRoom> findByPostIdAndApplicantIdAndDeletedAtIsNull(Long postId, Long applicantId);

    /**
     * 게시글 주인 ID로 삭제되지 않은 채팅방 목록 조회
     */
    List<ChatRoom> findByPostOwnerIdAndDeletedAtIsNullOrderByUpdatedAtDesc(Long postOwnerId);

    /**
     * 신청자 ID로 삭제되지 않은 채팅방 목록 조회
     */
    List<ChatRoom> findByApplicantIdAndDeletedAtIsNullOrderByUpdatedAtDesc(Long applicantId);

    /**
     * 게시글 ID로 삭제되지 않은 채팅방 목록 조회
     */
    List<ChatRoom> findByPostIdAndDeletedAtIsNull(Long postId);

    /**
     * 게시글 ID와 신청자 ID로 채팅방 존재 여부 확인
     */
    boolean existsByPostIdAndApplicantIdAndDeletedAtIsNull(Long postId, Long applicantId);
}
