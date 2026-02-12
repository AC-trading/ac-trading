package com.acnh.api.category.dto;

import com.acnh.api.category.entity.Category;
import lombok.Builder;
import lombok.Getter;

/**
 * 카테고리 응답 DTO
 */
@Getter
@Builder
public class CategoryResponse {

    private Long id;
    private String name;
    private Integer sortOrder;

    /**
     * Entity -> DTO 변환
     */
    public static CategoryResponse from(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .sortOrder(category.getSortOrder())
                .build();
    }
}
