package com.acnh.api.review.dto;

import com.acnh.api.review.entity.Review;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 리뷰 응답 DTO
 */
@Getter
@Builder
public class ReviewResponse {

    private Long id;
    private Long postId;
    private String postItemName;

    // 리뷰 작성자 정보
    private Long reviewerId;
    private String reviewerNickname;
    private String reviewerIslandName;

    // 리뷰 대상자 정보
    private Long revieweeId;
    private String revieweeNickname;

    private Integer rating;
    private String comment;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Entity -> DTO 변환 (기본)
     */
    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .postId(review.getPostId())
                .reviewerId(review.getReviewerId())
                .revieweeId(review.getRevieweeId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    /**
     * Entity -> DTO 변환 (유저 정보 포함)
     */
    public static ReviewResponse from(Review review, String reviewerNickname, String reviewerIslandName,
                                      String revieweeNickname, String postItemName) {
        return ReviewResponse.builder()
                .id(review.getId())
                .postId(review.getPostId())
                .postItemName(postItemName)
                .reviewerId(review.getReviewerId())
                .reviewerNickname(reviewerNickname)
                .reviewerIslandName(reviewerIslandName)
                .revieweeId(review.getRevieweeId())
                .revieweeNickname(revieweeNickname)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
