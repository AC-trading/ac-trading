package com.acnh.api.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 거래 통계 응답 DTO
 */
@Getter
@AllArgsConstructor
@Builder
public class TransactionSummaryResponse {

    private long totalSales;      // 총 판매액
    private long totalPurchases;  // 총 구매액
    private long netProfit;       // 순이익 (판매 - 구매)
    private long salesCount;      // 판매 건수
    private long purchaseCount;   // 구매 건수

    public static TransactionSummaryResponse of(
            long totalSales,
            long totalPurchases,
            long salesCount,
            long purchaseCount) {
        return TransactionSummaryResponse.builder()
                .totalSales(totalSales)
                .totalPurchases(totalPurchases)
                .netProfit(totalSales - totalPurchases)
                .salesCount(salesCount)
                .purchaseCount(purchaseCount)
                .build();
    }
}
