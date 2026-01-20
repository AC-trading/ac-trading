package com.acnh.api.priceoffer.service;

import com.acnh.api.chat.entity.ChatRoom;
import com.acnh.api.chat.repository.ChatRoomRepository;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.notification.entity.Notification;
import com.acnh.api.notification.enums.NotificationType;
import com.acnh.api.notification.repository.NotificationRepository;
import com.acnh.api.post.entity.Post;
import com.acnh.api.post.enums.CurrencyType;
import com.acnh.api.post.repository.PostRepository;
import com.acnh.api.priceoffer.dto.PriceOfferAcceptResponse;
import com.acnh.api.priceoffer.dto.PriceOfferCreateRequest;
import com.acnh.api.priceoffer.dto.PriceOfferResponse;
import com.acnh.api.priceoffer.entity.PriceOffer;
import com.acnh.api.priceoffer.repository.PriceOfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 가격 제안 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PriceOfferService {

    private final PriceOfferRepository priceOfferRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final NotificationRepository notificationRepository;
    private final ChatRoomRepository chatRoomRepository;

    /**
     * 가격 제안하기
     * - 가격제안 받기(priceNegotiable)가 true인 게시글만 제안 가능
     * - 본인 게시글에는 제안 불가
     * - 동일 게시글에 대기 중인 제안이 있으면 중복 제안 불가
     */
    @Transactional
    public PriceOfferResponse createPriceOffer(Long postId, PriceOfferCreateRequest request, String visitorId) {
        Member offerer = findMemberByUuid(visitorId);
        Post post = findPostById(postId);

        // 가격제안 받기 ON 체크
        if (!Boolean.TRUE.equals(post.getPriceNegotiable())) {
            throw new IllegalArgumentException("가격 제안을 받지 않는 게시글입니다");
        }

        // 본인 게시글 체크
        if (post.getUserId().equals(offerer.getId())) {
            throw new IllegalArgumentException("본인 게시글에는 가격 제안을 할 수 없습니다");
        }

        // 거래 가능 상태 체크
        if (!"AVAILABLE".equals(post.getStatus())) {
            throw new IllegalArgumentException("거래 가능한 게시글에만 가격 제안을 할 수 있습니다");
        }

        // 중복 제안 체크 (대기 중인 제안이 있는지)
        priceOfferRepository.findByPostIdAndOffererIdAndStatusAndDeletedAtIsNull(postId, offerer.getId(), "PENDING")
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("이미 대기 중인 가격 제안이 있습니다");
                });

        // 화폐 유형 결정 및 검증 (요청에 없으면 게시글 화폐 유형 사용)
        String currencyType = request.getCurrencyType();
        if (currencyType == null || currencyType.isBlank()) {
            currencyType = post.getCurrencyType();
        } else {
            // 요청에 화폐 유형이 있으면 유효성 검증
            validateCurrencyType(currencyType);
        }

        // 가격 제안 저장
        PriceOffer priceOffer = PriceOffer.builder()
                .postId(postId)
                .offererId(offerer.getId())
                .postOwnerId(post.getUserId())
                .offeredPrice(request.getOfferedPrice())
                .currencyType(currencyType)
                .build();

        PriceOffer savedOffer = priceOfferRepository.save(priceOffer);
        log.info("가격 제안 생성 - offerId: {}, postId: {}, offererId: {}, price: {}",
                savedOffer.getId(), postId, offerer.getId(), request.getOfferedPrice());

        // 게시글 작성자에게 알림 발송
        sendPriceOfferNotification(post, offerer, savedOffer);

        return PriceOfferResponse.from(savedOffer, offerer.getNickname(),
                offerer.getIslandName(), post.getItemName());
    }

    /**
     * 가격 제안 수락
     * - 게시글 작성자만 수락 가능
     * - 수락 시 채팅방 생성 (기존 채팅방이 있으면 해당 채팅방 반환)
     *
     * [PR Review 수정]
     * Before: priceOffer.accept()로 인메모리 상태 변경 (Race Condition 취약)
     * After: acceptPriceOfferAtomic()으로 원자적 DB 업데이트
     * 이유: 동시 요청 시 중복 수락 방지
     */
    @Transactional
    public PriceOfferAcceptResponse acceptPriceOffer(Long offerId, String visitorId) {
        Member postOwner = findMemberByUuid(visitorId);
        PriceOffer priceOffer = findPriceOfferById(offerId);

        // 게시글 작성자 체크
        if (!priceOffer.getPostOwnerId().equals(postOwner.getId())) {
            throw new IllegalArgumentException("게시글 작성자만 가격 제안을 수락할 수 있습니다");
        }

        // PENDING 상태 사전 검증 (명확한 에러 메시지 제공)
        if (!"PENDING".equals(priceOffer.getStatus())) {
            log.warn("가격 제안 수락 실패 - offerId: {}, currentStatus: {}", offerId, priceOffer.getStatus());
            throw new IllegalStateException(
                    String.format("대기 중인 제안만 수락할 수 있습니다 (현재 상태: %s)", priceOffer.getStatus()));
        }

        // 원자적 제안 수락 (Race Condition 방지)
        int updatedRows = priceOfferRepository.acceptPriceOfferAtomic(offerId);
        if (updatedRows == 0) {
            log.warn("가격 제안 수락 실패 (동시 요청) - offerId: {}", offerId);
            throw new IllegalStateException("이미 처리된 가격 제안입니다");
        }
        log.info("가격 제안 수락 - offerId: {}", offerId);

        // 채팅방 생성 또는 기존 채팅방 반환
        Long chatRoomId = createOrGetChatRoom(priceOffer);

        return PriceOfferAcceptResponse.from(offerId, chatRoomId);
    }

    // ========== Private Helper Methods ==========

    /**
     * 가격 제안 알림 발송
     */
    private void sendPriceOfferNotification(Post post, Member offerer, PriceOffer priceOffer) {
        // 화폐 단위 결정
        String currencyUnit = "MILE_TICKET".equals(priceOffer.getCurrencyType()) ? "마일 티켓" : "벨";

        String content = String.format("%s님이 %,d%s을 제안했어요",
                offerer.getNickname(), priceOffer.getOfferedPrice(), currencyUnit);

        Notification notification = Notification.builder()
                .userId(post.getUserId())
                .type(NotificationType.PRICE_OFFER_RECEIVED.name())
                .title("가격 제안이 도착했어요")
                .content(content)
                .referenceId(priceOffer.getId())
                .referenceType("PRICE_OFFER")
                .requesterId(offerer.getId())
                .offeredPrice(priceOffer.getOfferedPrice())
                .build();

        notificationRepository.save(notification);
        log.info("가격 제안 알림 발송 - userId: {}, offerId: {}", post.getUserId(), priceOffer.getId());
    }

    /**
     * 채팅방 생성 또는 기존 채팅방 반환
     */
    private Long createOrGetChatRoom(PriceOffer priceOffer) {
        // 기존 채팅방 확인
        ChatRoom existingRoom = chatRoomRepository
                .findByPostIdAndApplicantIdAndDeletedAtIsNull(priceOffer.getPostId(), priceOffer.getOffererId())
                .orElse(null);

        if (existingRoom != null) {
            return existingRoom.getId();
        }

        // 새 채팅방 생성
        ChatRoom chatRoom = ChatRoom.builder()
                .postId(priceOffer.getPostId())
                .postOwnerId(priceOffer.getPostOwnerId())
                .applicantId(priceOffer.getOffererId())
                .status("ACTIVE")
                .build();

        ChatRoom savedRoom = chatRoomRepository.save(chatRoom);
        log.info("채팅방 생성 (가격 제안 수락) - roomId: {}, postId: {}, applicantId: {}",
                savedRoom.getId(), priceOffer.getPostId(), priceOffer.getOffererId());

        return savedRoom.getId();
    }

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
     * 가격 제안 ID로 조회
     */
    private PriceOffer findPriceOfferById(Long offerId) {
        return priceOfferRepository.findByIdAndDeletedAtIsNull(offerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 가격 제안입니다"));
    }

    /**
     * 화폐 유형 유효성 검증
     * - BELL, MILE_TICKET만 허용
     */
    private void validateCurrencyType(String currencyType) {
        try {
            CurrencyType.valueOf(currencyType);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("화폐 유형은 BELL 또는 MILE_TICKET만 가능합니다");
        }
    }
}
