package com.acnh.api.chat.service;

import com.acnh.api.chat.dto.*;
import com.acnh.api.chat.entity.ChatMessage;
import com.acnh.api.chat.entity.ChatRoom;
import com.acnh.api.chat.repository.ChatMessageRepository;
import com.acnh.api.chat.repository.ChatRoomRepository;
import com.acnh.api.filter.ProfanityFilter;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.post.entity.Post;
import com.acnh.api.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final ProfanityFilter profanityFilter;

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
     *
     * [PR Review 수정]
     * Before: 모든 채팅방을 메모리에 로드 후 Java에서 정렬/페이징 (인메모리 페이징)
     * After: DB 레벨에서 페이징 처리 (findByParticipantId)
     * 이유: 채팅방 수가 많아질 경우 메모리 부족 및 성능 저하 방지
     */
    public ChatRoomListResponse getMyChatRooms(String visitorId, Pageable pageable) {
        Member member = findMemberByUuid(visitorId);
        Long currentUserId = member.getId();

        // DB 레벨에서 페이징 처리 (postOwner 또는 applicant로 참여한 채팅방)
        Page<ChatRoom> chatRoomPage = chatRoomRepository.findByParticipantId(currentUserId, pageable);
        List<ChatRoom> pagedRooms = chatRoomPage.getContent();

        if (pagedRooms.isEmpty()) {
            return ChatRoomListResponse.from(chatRoomPage.map(room -> null));
        }

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
        Page<ChatRoomResponse> responsePage = chatRoomPage.map(room ->
                toChatRoomResponseFromMaps(room, currentUserId, postMap, memberMap, lastMessageMap, unreadCountMap));

        return ChatRoomListResponse.from(responsePage);
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
     *
     * [PR Review 수정]
     * Before: 빈 메시지 목록에도 memberRepository 쿼리 실행
     * After: messages.isEmpty() 시 빈 리스트 즉시 반환
     * 이유: 불필요한 IN 쿼리 방지
     */
    public List<ChatMessageResponse> getMessages(Long roomId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        ChatRoom chatRoom = findChatRoomById(roomId);

        // 참여자만 조회 가능
        validateParticipant(chatRoom, member.getId());

        List<ChatMessage> messages = chatMessageRepository
                .findByChatRoomIdAndDeletedAtIsNullOrderByCreatedAtAsc(roomId);

        // 메시지가 없으면 빈 리스트 반환 (불필요한 쿼리 방지)
        if (messages.isEmpty()) {
            return List.of();
        }

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
     * - 금칙어 필터링 적용 (앱스토어 정책 대응)
     *
     * [PR Review 수정]
     * Before: 메시지만 저장, 채팅방 updatedAt 미갱신
     * After: 메시지 저장 후 채팅방 updatedAt 갱신
     * 이유: getMyChatRooms 정렬이 최신 메시지 기준으로 동작하도록
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

        // 금칙어 필터링 (TEXT 메시지만 검사)
        String content = request.getContent();
        if ("TEXT".equals(messageType) && content != null) {
            // 금칙어 포함 시 마스킹 처리 (또는 예외 발생으로 변경 가능)
            content = profanityFilter.maskProfanity(content);
        }

        ChatMessage message = ChatMessage.builder()
                .chatRoomId(request.getChatRoomId())
                .senderId(senderId)
                .messageType(messageType)
                .content(content)
                .imageUrl(request.getImageUrl())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);

        // 채팅방 updatedAt 갱신 (목록 정렬용)
        chatRoom.touch();

        Member sender = memberRepository.findByIdAndDeletedAtIsNull(senderId).orElse(null);
        String nickname = sender != null ? sender.getNickname() : "알 수 없음";

        log.info("메시지 저장 - roomId: {}, senderId: {}, type: {}",
                request.getChatRoomId(), senderId, messageType);

        return ChatMessageResponse.from(savedMessage, nickname);
    }

    /**
     * 메시지 읽음 처리 (STOMP에서 호출)
     *
     * [PR Review 수정]
     * Before: unreadMessages.size()로 로그 출력 (실제 처리 수와 다름)
     * After: 실제 읽음 처리된 메시지 수만 카운트하여 로그 출력
     * 이유: 로그의 정확성 향상
     */
    @Transactional
    public void markMessagesAsRead(Long roomId, Long userId) {
        ChatRoom chatRoom = findChatRoomById(roomId);

        // 참여자만 읽음 처리 가능
        validateParticipant(chatRoom, userId);

        // 상대방이 보낸 읽지 않은 메시지들 읽음 처리
        List<ChatMessage> unreadMessages = chatMessageRepository
                .findByChatRoomIdAndIsReadFalseAndDeletedAtIsNull(roomId);

        int markedCount = 0;
        for (ChatMessage message : unreadMessages) {
            // 내가 보낸 메시지가 아닌 것만 읽음 처리
            if (!message.getSenderId().equals(userId)) {
                message.markAsRead();
                markedCount++;
            }
        }

        log.info("메시지 읽음 처리 - roomId: {}, userId: {}, count: {}",
                roomId, userId, markedCount);
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

    /**
     * 예약자 지정
     * - 게시글 작성자만 예약자 지정 가능
     * - 채팅방의 신청자(applicant)를 예약자로 지정
     */
    @Transactional
    public ChatRoomResponse reserveChatRoom(Long roomId, String visitorId, LocalDateTime scheduledTradeAt) {
        Member member = findMemberByUuid(visitorId);
        ChatRoom chatRoom = findChatRoomById(roomId);

        // 게시글 작성자만 예약 가능
        if (!chatRoom.getPostOwnerId().equals(member.getId())) {
            throw new IllegalArgumentException("게시글 작성자만 예약자를 지정할 수 있습니다");
        }

        // 이미 예약된 경우
        if (chatRoom.getReservedUserId() != null) {
            throw new IllegalArgumentException("이미 예약된 채팅방입니다");
        }

        // 채팅방의 신청자를 예약자로 지정
        chatRoom.reserve(chatRoom.getApplicantId(), scheduledTradeAt);
        chatRoom.updateStatus("RESERVED");

        log.info("예약자 지정 - roomId: {}, reservedUserId: {}", roomId, chatRoom.getApplicantId());

        return toChatRoomResponse(chatRoom, member.getId());
    }

    /**
     * 예약 해제
     * - 게시글 작성자만 예약 해제 가능
     */
    @Transactional
    public ChatRoomResponse unreserveChatRoom(Long roomId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        ChatRoom chatRoom = findChatRoomById(roomId);

        // 게시글 작성자만 예약 해제 가능
        if (!chatRoom.getPostOwnerId().equals(member.getId())) {
            throw new IllegalArgumentException("게시글 작성자만 예약을 해제할 수 있습니다");
        }

        // 예약되지 않은 경우
        if (chatRoom.getReservedUserId() == null) {
            throw new IllegalArgumentException("예약되지 않은 채팅방입니다");
        }

        chatRoom.cancelReservation();
        chatRoom.updateStatus("ACTIVE");

        log.info("예약 해제 - roomId: {}", roomId);

        return toChatRoomResponse(chatRoom, member.getId());
    }

    /**
     * 거래 완료 처리
     * - 게시글 작성자만 거래 완료 처리 가능
     * - 예약된 채팅방만 거래 완료 가능
     */
    @Transactional
    public ChatRoomResponse completeTrade(Long roomId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        ChatRoom chatRoom = findChatRoomById(roomId);

        // 게시글 작성자만 거래 완료 가능
        if (!chatRoom.getPostOwnerId().equals(member.getId())) {
            throw new IllegalArgumentException("게시글 작성자만 거래 완료 처리할 수 있습니다");
        }

        // 예약된 채팅방만 거래 완료 가능
        if (chatRoom.getReservedUserId() == null) {
            throw new IllegalArgumentException("예약된 채팅방만 거래 완료 처리할 수 있습니다");
        }

        chatRoom.updateStatus("COMPLETED");

        // 게시글 상태도 거래완료로 변경
        Post post = findPostById(chatRoom.getPostId());
        post.updateStatus("COMPLETED");

        log.info("거래 완료 - roomId: {}, postId: {}", roomId, chatRoom.getPostId());

        return toChatRoomResponse(chatRoom, member.getId());
    }

    /**
     * 채팅방 나가기 (soft delete)
     * - 참여자(게시글 작성자 또는 신청자)만 나가기 가능
     */
    @Transactional
    public void leaveChatRoom(Long roomId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        ChatRoom chatRoom = findChatRoomById(roomId);

        // 참여자만 나가기 가능
        validateParticipant(chatRoom, member.getId());

        // soft delete
        chatRoom.delete();

        log.info("채팅방 나가기 - roomId: {}, userId: {}", roomId, member.getId());
    }

    /**
     * 게시글별 채팅방 목록 조회 (작성자용)
     * - 게시글 작성자만 조회 가능
     */
    public List<ChatRoomResponse> getChatRoomsByPostId(Long postId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Post post = findPostById(postId);

        // 게시글 작성자만 조회 가능
        if (!post.getUserId().equals(member.getId())) {
            throw new IllegalArgumentException("게시글 작성자만 조회할 수 있습니다");
        }

        List<ChatRoom> chatRooms = chatRoomRepository.findByPostIdAndDeletedAtIsNull(postId);

        return chatRooms.stream()
                .map(room -> toChatRoomResponse(room, member.getId()))
                .toList();
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
     *
     * [PR Review 수정]
     * Before: 전체 메시지 목록 조회 후 마지막 메시지 추출 (비효율)
     * After: findFirstByChatRoomIdAndDeletedAtIsNullOrderByCreatedAtDesc로 1건만 조회
     * 이유: 불필요한 전체 데이터 로드 방지
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

        // 마지막 메시지 (1건만 조회)
        String lastMessage = null;
        LocalDateTime lastMessageAt = null;
        var lastMsgOpt = chatMessageRepository
                .findFirstByChatRoomIdAndDeletedAtIsNullOrderByCreatedAtDesc(chatRoom.getId());
        if (lastMsgOpt.isPresent()) {
            ChatMessage lastMsg = lastMsgOpt.get();
            lastMessage = lastMsg.getMessageType().equals("IMAGE") ? "[이미지]" : lastMsg.getContent();
            lastMessageAt = lastMsg.getCreatedAt();
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
