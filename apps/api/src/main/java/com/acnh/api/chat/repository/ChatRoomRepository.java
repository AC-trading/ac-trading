package com.acnh.api.chat.repository;

import com.acnh.api.chat.entity.ChatRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    /**
     * 참여자(게시글 주인 또는 신청자)로 삭제되지 않은 채팅방 페이징 조회
     * - DB 레벨에서 페이징 처리하여 인메모리 페이징 방지
     */
    @Query("SELECT c FROM ChatRoom c WHERE c.deletedAt IS NULL " +
            "AND (c.postOwnerId = :userId OR c.applicantId = :userId) " +
            "ORDER BY c.updatedAt DESC")
    Page<ChatRoom> findByParticipantId(@Param("userId") Long userId, Pageable pageable);
}
