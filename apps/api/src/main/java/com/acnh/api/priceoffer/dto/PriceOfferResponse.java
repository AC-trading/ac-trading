package com.acnh.api.priceoffer.dto;

import com.acnh.api.priceoffer.entity.PriceOffer;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 가격 제안 응답 DTO
 */
@Getter
@Builder
public class PriceOfferResponse {

    private Long id;
    private Long postId;
    private String postItemName;

    private Long offererId;
    private String offererNickname;
    private String offererIslandName;

    private Integer offeredPrice;
    private String currencyType;
    private String status;

    private LocalDateTime createdAt;

    /**
     * Entity -> DTO 변환 (기본)
     */
    public static PriceOfferResponse from(PriceOffer priceOffer) {
        return PriceOfferResponse.builder()
                .id(priceOffer.getId())
                .postId(priceOffer.getPostId())
                .offererId(priceOffer.getOffererId())
                .offeredPrice(priceOffer.getOfferedPrice())
                .currencyType(priceOffer.getCurrencyType())
                .status(priceOffer.getStatus())
                .createdAt(priceOffer.getCreatedAt())
                .build();
    }

    /**
     * Entity -> DTO 변환 (제안자 정보, 게시글 정보 포함)
     */
    public static PriceOfferResponse from(PriceOffer priceOffer, String offererNickname,
                                          String offererIslandName, String postItemName) {
        return PriceOfferResponse.builder()
                .id(priceOffer.getId())
                .postId(priceOffer.getPostId())
                .postItemName(postItemName)
                .offererId(priceOffer.getOffererId())
                .offererNickname(offererNickname)
                .offererIslandName(offererIslandName)
                .offeredPrice(priceOffer.getOfferedPrice())
                .currencyType(priceOffer.getCurrencyType())
                .status(priceOffer.getStatus())
                .createdAt(priceOffer.getCreatedAt())
                .build();
    }
}
