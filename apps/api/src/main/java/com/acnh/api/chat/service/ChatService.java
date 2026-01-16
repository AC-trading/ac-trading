package com.acnh.api.chat.service;

import com.acnh.api.chat.dto.*;
import com.acnh.api.chat.entity.ChatMessage;
import com.acnh.api.chat.entity.ChatRoom;
import com.acnh.api.chat.repository.ChatMessageRepository;
import com.acnh.api.chat.repository.ChatRoomRepository;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.post.entity.Post;
import com.acnh.api.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 채팅 관련 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MemberRepository memberRepository;
    private final PostRepository postRepository;

    /**
     * 채팅방 생성 또는 기존 채팅방 반환
     */
    @Transactional
    public ChatRoomResponse createOrGetChatRoom(ChatRoomCreateRequest request, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Post post = findPostById(request.getPostId());

        // 자기 게시글에는 채팅방 생성 불가
        if (post.getUserId().equals(member.getId())) {
            throw new IllegalArgumentException("본인 게시글에는 채팅을 시작할 수 없습니다");
        }

        // 기존 채팅방이 있으면 반환
        ChatRoom existingRoom = chatRoomRepository
                .findByPostIdAndApplicantIdAndDeletedAtIsNull(request.getPostId(), member.getId())
                .orElse(null);

        if (existingRoom != null) {
            return toChatRoomResponse(existingRoom, member.getId());
        }

        // 새 채팅방 생성
        ChatRoom chatRoom = ChatRoom.builder()
                .postId(request.getPostId())
                .postOwnerId(post.getUserId())
                .applicantId(member.getId())
                .status("ACTIVE")
                .build();

        ChatRoom savedRoom = chatRoomRepository.save(chatRoom);
        log.info("채팅방 생성 - roomId: {}, postId: {}, applicantId: {}",
                savedRoom.getId(), request.getPostId(), member.getId());

        return toChatRoomResponse(savedRoom, member.getId());
    }

    /**
     * 내 채팅방 목록 조회
     * - N+1 문제 방지를 위해 관련 데이터 일괄 조회
     */
    public ChatRoomListResponse getMyChatRooms(String visitorId, Pageable pageable) {
        Member member = findMemberByUuid(visitorId);
        Long currentUserId = member.getId();

        // postOwner 또는 applicant로 참여한 채팅방 모두 조회
        List<ChatRoom> asOwner = chatRoomRepository
                .findByPostOwnerIdAndDeletedAtIsNullOrderByUpdatedAtDesc(currentUserId);
        List<ChatRoom> asApplicant = chatRoomRepository
                .findByApplicantIdAndDeletedAtIsNullOrderByUpdatedAtDesc(currentUserId);

        // 합치고 updatedAt 기준 정렬
        List<ChatRoom> allRooms = new ArrayList<>();
        allRooms.addAll(asOwner);
        allRooms.addAll(asApplicant);
        allRooms.sort((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()));

        // 페이징 처리
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allRooms.size());

        if (start >= allRooms.size()) {
            Page<ChatRoomResponse> emptyPage = new PageImpl<>(new ArrayList<>(), pageable, allRooms.size());
            return ChatRoomListResponse.from(emptyPage);
        }

        List<ChatRoom> pagedRooms = allRooms.subList(start, end);

        // 관련 데이터 일괄 조회를 위한 ID 수집
        List<Long> postIds = pagedRooms.stream().map(ChatRoom::getPostId).distinct().toList();
        List<Long> chatRoomIds = pagedRooms.stream().map(ChatRoom::getId).toList();
        List<Long> otherUserIds = pagedRooms.stream()
                .map(room -> room.getPostOwnerId().equals(currentUserId)
                        ? room.getApplicantId() : room.getPostOwnerId())
                .distinct()
                .toList();

        /*
         * [PR Review 수정]
         * Before: toChatRoomResponse()에서 채팅방마다 개별 쿼리 실행 (N+1 문제)
         * After: 필요한 데이터를 미리 일괄 조회 후 Map으로 변환하여 O(1) lookup
         * 이유: 채팅방 N개 조회 시 4*N개 쿼리 -> 고정 6개 쿼리로 성능 개선
         */
        Map<Long, Post> postMap = postRepository.findByIdInAndDeletedAtIsNull(postIds)
                .stream()
                .collect(Collectors.toMap(Post::getId, Function.identity()));

        Map<Long, Member> memberMap = memberRepository.findByIdInAndDeletedAtIsNull(otherUserIds)
                .stream()
                .collect(Collectors.toMap(Member::getId, Function.identity()));

        Map<Long, ChatMessage> lastMessageMap = chatMessageRepository.findLastMessagesByChatRoomIds(chatRoomIds)
                .stream()
                .collect(Collectors.toMap(ChatMessage::getChatRoomId, Function.identity()));

        Map<Long, Long> unreadCountMap = chatMessageRepository
                .countUnreadMessagesByChatRoomIds(chatRoomIds, currentUserId)
                .stream()
                .collect(Collectors.toMap(
                        arr -> (Long) arr[0],
                        arr -> (Long) arr[1]
                ));

        // 응답 생성 (Map에서 조회하여 N+1 방지)
        List<ChatRoomResponse> responses = pagedRooms.stream()
                .map(room -> toChatRoomResponseFromMaps(room, currentUserId,
                        postMap, memberMap, lastMessageMap, unreadCountMap))
                .toList();

        Page<ChatRoomResponse> page = new PageImpl<>(responses, pageable, allRooms.size());
        return ChatRoomListResponse.from(page);
    }

    /**
     * 채팅방 상세 조회
     */
    public ChatRoomResponse getChatRoom(Long roomId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        ChatRoom chatRoom = findChatRoomById(roomId);

        // 참여자만 조회 가능
        validateParticipant(chatRoom, member.getId());

        return toChatRoomResponse(chatRoom, member.getId());
    }

    /**
     * 채팅 메시지 목록 조회 (이전 메시지)
     * - N+1 문제 방지를 위해 sender 정보를 일괄 조회
     */
    public List<ChatMessageResponse> getMessages(Long roomId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        ChatRoom chatRoom = findChatRoomById(roomId);

        // 참여자만 조회 가능
        validateParticipant(chatRoom, member.getId());

        List<ChatMessage> messages = chatMessageRepository
                .findByChatRoomIdAndDeletedAtIsNullOrderByCreatedAtAsc(roomId);

        // sender ID 목록 추출 후 일괄 조회
        List<Long> senderIds = messages.stream()
                .map(ChatMessage::getSenderId)
                .distinct()
                .toList();

        Map<Long, Member> senderMap = memberRepository.findByIdInAndDeletedAtIsNull(senderIds)
                .stream()
                .collect(Collectors.toMap(Member::getId, Function.identity()));

        return messages.stream()
                .map(msg -> {
                    Member sender = senderMap.get(msg.getSenderId());
                    String nickname = sender != null ? sender.getNickname() : "알 수 없음";
                    return ChatMessageResponse.from(msg, nickname);
                })
                .toList();
    }

    /**
     * 메시지 저장 (STOMP에서 호출)
     */
    @Transactional
    public ChatMessageResponse saveMessage(ChatMessageRequest request, Long senderId) {
        ChatRoom chatRoom = findChatRoomById(request.getChatRoomId());

        // 참여자만 메시지 전송 가능
        validateParticipant(chatRoom, senderId);

        // 메시지 타입 기본값 설정
        String messageType = request.getMessageType();
        if (messageType == null || messageType.isBlank()) {
            messageType = "TEXT";
        }

        ChatMessage message = ChatMessage.builder()
                .chatRoomId(request.getChatRoomId())
                .senderId(senderId)
                .messageType(messageType)
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);

        Member sender = memberRepository.findByIdAndDeletedAtIsNull(senderId).orElse(null);
        String nickname = sender != null ? sender.getNickname() : "알 수 없음";

        log.info("메시지 저장 - roomId: {}, senderId: {}, type: {}",
                request.getChatRoomId(), senderId, messageType);

        return ChatMessageResponse.from(savedMessage, nickname);
    }

    /**
     * 메시지 읽음 처리 (STOMP에서 호출)
     */
    @Transactional
    public void markMessagesAsRead(Long roomId, Long userId) {
        ChatRoom chatRoom = findChatRoomById(roomId);

        // 참여자만 읽음 처리 가능
        validateParticipant(chatRoom, userId);

        // 상대방이 보낸 읽지 않은 메시지들 읽음 처리
        List<ChatMessage> unreadMessages = chatMessageRepository
                .findByChatRoomIdAndIsReadFalseAndDeletedAtIsNull(roomId);

        for (ChatMessage message : unreadMessages) {
            // 내가 보낸 메시지가 아닌 것만 읽음 처리
            if (!message.getSenderId().equals(userId)) {
                message.markAsRead();
            }
        }

        log.info("메시지 읽음 처리 - roomId: {}, userId: {}, count: {}",
                roomId, userId, unreadMessages.size());
    }

    /**
     * 사용자 ID로 Member 조회 (Long ID 사용)
     */
    public Member findMemberById(Long memberId) {
        return memberRepository.findByIdAndDeletedAtIsNull(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }

    /**
     * UUID로 회원 조회 (STOMP 컨트롤러에서 사용)
     */
    public Member getMemberByUuid(String visitorId) {
        return findMemberByUuid(visitorId);
    }

    // ========== Private Helper Methods ==========

    /**
     * UUID로 회원 조회
     */
    private Member findMemberByUuid(String visitorId) {
        if (visitorId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다");
        }
        return memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(visitorId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }

    /**
     * 게시글 ID로 조회
     */
    private Post findPostById(Long postId) {
        return postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다"));
    }

    /**
     * 채팅방 ID로 조회
     */
    private ChatRoom findChatRoomById(Long roomId) {
        return chatRoomRepository.findByIdAndDeletedAtIsNull(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다"));
    }

    /**
     * 채팅방 참여자 검증
     */
    private void validateParticipant(ChatRoom chatRoom, Long userId) {
        if (!chatRoom.getPostOwnerId().equals(userId) && !chatRoom.getApplicantId().equals(userId)) {
            throw new IllegalArgumentException("채팅방에 접근 권한이 없습니다");
        }
    }

    /**
     * ChatRoom -> ChatRoomResponse 변환 (단일 채팅방용, 개별 쿼리 사용)
     */
    private ChatRoomResponse toChatRoomResponse(ChatRoom chatRoom, Long currentUserId) {
        // 게시글 정보
        Post post = postRepository.findByIdAndDeletedAtIsNull(chatRoom.getPostId()).orElse(null);
        String postItemName = post != null ? post.getItemName() : "삭제된 게시글";
        // TODO: Post에 이미지 필드 추가 시 연동 필요
        String postImageUrl = null;
        Integer postPrice = post != null ? post.getPrice() : null;
        String postStatus = post != null ? post.getStatus() : null;

        // 상대방 정보
        Long otherUserId = chatRoom.getPostOwnerId().equals(currentUserId)
                ? chatRoom.getApplicantId()
                : chatRoom.getPostOwnerId();
        Member otherUser = memberRepository.findByIdAndDeletedAtIsNull(otherUserId).orElse(null);
        String otherNickname = otherUser != null ? otherUser.getNickname() : "알 수 없음";
        String otherIslandName = otherUser != null ? otherUser.getIslandName() : null;

        // 마지막 메시지
        List<ChatMessage> messages = chatMessageRepository
                .findByChatRoomIdAndDeletedAtIsNullOrderByCreatedAtAsc(chatRoom.getId());
        String lastMessage = null;
        LocalDateTime lastMessageAt = null;
        if (!messages.isEmpty()) {
            ChatMessage last = messages.get(messages.size() - 1);
            lastMessage = last.getMessageType().equals("IMAGE") ? "[이미지]" : last.getContent();
            lastMessageAt = last.getCreatedAt();
        }

        // 읽지 않은 메시지 수
        int unreadCount = (int) chatMessageRepository
                .countByChatRoomIdAndSenderIdNotAndIsReadFalseAndDeletedAtIsNull(chatRoom.getId(), currentUserId);

        return ChatRoomResponse.from(chatRoom, currentUserId, postItemName, postImageUrl, postPrice, postStatus,
                otherNickname, otherIslandName, lastMessage, lastMessageAt, unreadCount);
    }

    /**
     * ChatRoom -> ChatRoomResponse 변환 (목록 조회용, 미리 조회된 Map 사용하여 N+1 방지)
     */
    private ChatRoomResponse toChatRoomResponseFromMaps(
            ChatRoom chatRoom,
            Long currentUserId,
            Map<Long, Post> postMap,
            Map<Long, Member> memberMap,
            Map<Long, ChatMessage> lastMessageMap,
            Map<Long, Long> unreadCountMap) {

        // 게시글 정보
        Post post = postMap.get(chatRoom.getPostId());
        String postItemName = post != null ? post.getItemName() : "삭제된 게시글";
        // TODO: Post에 이미지 필드 추가 시 연동 필요
        String postImageUrl = null;
        Integer postPrice = post != null ? post.getPrice() : null;
        String postStatus = post != null ? post.getStatus() : null;

        // 상대방 정보
        Long otherUserId = chatRoom.getPostOwnerId().equals(currentUserId)
                ? chatRoom.getApplicantId()
                : chatRoom.getPostOwnerId();
        Member otherUser = memberMap.get(otherUserId);
        String otherNickname = otherUser != null ? otherUser.getNickname() : "알 수 없음";
        String otherIslandName = otherUser != null ? otherUser.getIslandName() : null;

        // 마지막 메시지
        ChatMessage lastMsg = lastMessageMap.get(chatRoom.getId());
        String lastMessage = null;
        LocalDateTime lastMessageAt = null;
        if (lastMsg != null) {
            lastMessage = lastMsg.getMessageType().equals("IMAGE") ? "[이미지]" : lastMsg.getContent();
            lastMessageAt = lastMsg.getCreatedAt();
        }

        // 읽지 않은 메시지 수
        int unreadCount = unreadCountMap.getOrDefault(chatRoom.getId(), 0L).intValue();

        return ChatRoomResponse.from(chatRoom, currentUserId, postItemName, postImageUrl, postPrice, postStatus,
                otherNickname, otherIslandName, lastMessage, lastMessageAt, unreadCount);
    }
}
