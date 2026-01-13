package com.acnh.api.category.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 카테고리 Entity
 * - categories 테이블 매핑
 */
@Entity
@Table(name = "categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Builder
    public Category(String name, Integer sortOrder) {
        this.name = name;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
    }

    /**
     * 카테고리명 수정
     */
    public void updateName(String name) {
        this.name = name;
    }

    /**
     * 정렬 순서 수정
     */
    public void updateSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
