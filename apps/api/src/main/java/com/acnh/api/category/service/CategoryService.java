package com.acnh.api.category.service;

import com.acnh.api.category.dto.CategoryListResponse;
import com.acnh.api.category.dto.CategoryResponse;
import com.acnh.api.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 카테고리 관련 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * 전체 카테고리 목록 조회
     * - sortOrder 기준 정렬
     */
    public CategoryListResponse getAllCategories() {
        List<CategoryResponse> categories = categoryRepository
                .findByDeletedAtIsNullOrderBySortOrderAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();

        log.info("카테고리 목록 조회 - count: {}", categories.size());

        return CategoryListResponse.from(categories);
    }
}
