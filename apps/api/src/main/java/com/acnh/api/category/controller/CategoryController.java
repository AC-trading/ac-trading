package com.acnh.api.category.controller;

import com.acnh.api.category.dto.CategoryListResponse;
import com.acnh.api.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 카테고리 관련 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * 카테고리 목록 조회
     * GET /api/categories
     * - 인증 불필요
     */
    @GetMapping
    public ResponseEntity<CategoryListResponse> getAllCategories() {
        log.info("카테고리 목록 조회 요청");

        CategoryListResponse response = categoryService.getAllCategories();
        return ResponseEntity.ok(response);
    }
}
