package com.acnh.api.transaction.dto;

import com.acnh.api.transaction.entity.Transaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 거래 내역 응답 DTO
 */
@Getter
@AllArgsConstructor
@Builder
public class TransactionResponse {

    private Long id;
    private Long postId;
    private String postItemName;
    private String type;  // SALE, PURCHASE
    private String currencyType;  // BELL, MILE_TICKET
    private Integer amount;
    private Long partnerId;
    private String partnerNickname;
    private String memo;
    private LocalDateTime tradedAt;
    private LocalDateTime createdAt;

    public static TransactionResponse from(Transaction entity) {
        return TransactionResponse.builder()
                .id(entity.getId())
                .postId(entity.getPostId())
                .postItemName(entity.getItemName())
                .type(entity.getType().name())
                .currencyType(entity.getCurrencyType().name())
                .amount(entity.getAmount())
                .partnerId(entity.getPartnerId())
                .partnerNickname(entity.getPartnerNickname())
                .memo(entity.getMemo())
                .tradedAt(entity.getTradedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
