package com.acnh.api.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 거래 내역 목록 응답 DTO
 */
@Getter
@AllArgsConstructor
@Builder
public class TransactionListResponse {

    private List<TransactionResponse> transactions;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;

    public static TransactionListResponse from(Page<TransactionResponse> page) {
        return TransactionListResponse.builder()
                .transactions(page.getContent())
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .hasNext(page.hasNext())
                .build();
    }
}
