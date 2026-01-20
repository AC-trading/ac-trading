package com.acnh.api.review.dto;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 리뷰 목록 페이징 응답 DTO
 */
@Getter
@Builder
public class ReviewListResponse {

    private List<ReviewResponse> reviews;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
    private boolean hasPrevious;

    // 리뷰 통계 정보
    private Double averageRating;
    private Long reviewCount;

    /**
     * Page -> DTO 변환
     */
    public static ReviewListResponse from(Page<ReviewResponse> page) {
        return ReviewListResponse.builder()
                .reviews(page.getContent())
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }

    /**
     * Page -> DTO 변환 (통계 정보 포함)
     */
    public static ReviewListResponse from(Page<ReviewResponse> page, Double averageRating, Long reviewCount) {
        return ReviewListResponse.builder()
                .reviews(page.getContent())
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .averageRating(averageRating)
                .reviewCount(reviewCount)
                .build();
    }
}
