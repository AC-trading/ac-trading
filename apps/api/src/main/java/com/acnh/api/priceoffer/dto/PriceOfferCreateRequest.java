package com.acnh.api.priceoffer.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 가격 제안 요청 DTO
 */
@Getter
@NoArgsConstructor
public class PriceOfferCreateRequest {

    @NotNull(message = "제안 가격은 필수입니다")
    @Positive(message = "제안 가격은 0보다 커야 합니다")
    private Integer offeredPrice;

    // 화폐 유형 (BELL, MILE_TICKET) - 선택 (게시글 화폐 유형 따라감)
    private String currencyType;
}
