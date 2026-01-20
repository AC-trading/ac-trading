package com.acnh.api.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 리뷰 작성 요청 DTO
 */
@Getter
@NoArgsConstructor
public class ReviewCreateRequest {

    @NotNull(message = "게시글 ID는 필수입니다")
    private Long postId;

    @NotNull(message = "리뷰 대상자 ID는 필수입니다")
    private Long revieweeId;

    @NotNull(message = "별점은 필수입니다")
    @Min(value = 0, message = "별점은 0점 이상이어야 합니다")
    @Max(value = 5, message = "별점은 5점 이하여야 합니다")
    private Integer rating;

    @Size(max = 500, message = "후기는 500자 이하여야 합니다")
    private String comment;
}
