package com.acnh.api.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 게시글 작성 요청 DTO
 */
@Getter
@NoArgsConstructor
public class PostCreateRequest {

    @NotBlank(message = "게시글 유형은 필수입니다")
    private String postType;  // SELL, BUY

    @NotNull(message = "카테고리는 필수입니다")
    private Long categoryId;

    @NotBlank(message = "아이템명은 필수입니다")
    @Size(max = 100, message = "아이템명은 100자 이하여야 합니다")
    private String itemName;

    private String currencyType;  // BELL, MILE_TICKET (선택)

    private Integer price;  // 선택 (0이면 나눔/교환)

    private Boolean priceNegotiable;  // 가격제안 받기

    @NotBlank(message = "상세 설명은 필수입니다")
    private String description;
}
