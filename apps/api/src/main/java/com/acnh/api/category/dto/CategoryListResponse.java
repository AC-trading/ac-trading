package com.acnh.api.category.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 카테고리 목록 응답 DTO
 */
@Getter
@Builder
public class CategoryListResponse {

    private List<CategoryResponse> categories;

    public static CategoryListResponse from(List<CategoryResponse> categories) {
        return CategoryListResponse.builder()
                .categories(categories)
                .build();
    }
}
