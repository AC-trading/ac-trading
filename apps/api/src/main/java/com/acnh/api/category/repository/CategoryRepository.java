package com.acnh.api.category.repository;

import com.acnh.api.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 카테고리 Repository
 */
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * ID로 삭제되지 않은 카테고리 조회
     */
    Optional<Category> findByIdAndDeletedAtIsNull(Long id);

    /**
     * 이름으로 삭제되지 않은 카테고리 조회
     */
    Optional<Category> findByNameAndDeletedAtIsNull(String name);

    /**
     * 삭제되지 않은 모든 카테고리 정렬순으로 조회
     */
    List<Category> findByDeletedAtIsNullOrderBySortOrderAsc();
}
