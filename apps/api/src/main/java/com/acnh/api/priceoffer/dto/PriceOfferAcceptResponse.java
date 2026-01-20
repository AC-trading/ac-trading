package com.acnh.api.priceoffer.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 가격 제안 수락 응답 DTO
 * - 수락 시 채팅방 정보 포함
 */
@Getter
@Builder
public class PriceOfferAcceptResponse {

    private Long offerId;
    private String status;
    private Long chatRoomId;
    private String message;

    public static PriceOfferAcceptResponse from(Long offerId, Long chatRoomId) {
        return PriceOfferAcceptResponse.builder()
                .offerId(offerId)
                .status("ACCEPTED")
                .chatRoomId(chatRoomId)
                .message("가격 제안을 수락했습니다. 채팅방에서 거래를 진행하세요.")
                .build();
    }
}
