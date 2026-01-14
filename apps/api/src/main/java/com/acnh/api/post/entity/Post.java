package com.acnh.api.post.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 게시글 Entity
 * - posts 테이블 매핑
 */
@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "post_type", length = 10)
    private String postType;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    @Column(name = "currency_type", length = 20)
    private String currencyType;

    @Column(name = "price")
    private Integer price;

    @Column(name = "price_negotiable", nullable = false)
    private Boolean priceNegotiable;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount;

    @Column(name = "bumped_at")
    private LocalDateTime bumpedAt;

    @Builder
    public Post(Long userId, String postType, String status, Long categoryId,
                String itemName, String currencyType, Integer price,
                Boolean priceNegotiable, String description) {
        this.userId = userId;
        this.postType = postType;
        this.status = status != null ? status : "AVAILABLE";
        this.categoryId = categoryId;
        this.itemName = itemName;
        this.currencyType = currencyType;
        this.price = price;
        this.priceNegotiable = priceNegotiable != null ? priceNegotiable : false;
        this.description = description;
        this.likeCount = 0;
    }

    /**
     * 게시글 수정
     */
    public void update(String postType, Long categoryId, String itemName,
                       String currencyType, Integer price, Boolean priceNegotiable,
                       String description) {
        if (itemName == null || itemName.isBlank()) {
            throw new IllegalArgumentException("아이템명은 필수입니다");
        }
        if (categoryId == null) {
            throw new IllegalArgumentException("카테고리는 필수입니다");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("설명은 필수입니다");
        }

        this.postType = postType;
        this.categoryId = categoryId;
        this.itemName = itemName;
        this.currencyType = currencyType;
        this.price = price;
        this.priceNegotiable = priceNegotiable != null ? priceNegotiable : false;
        this.description = description;
    }

    /**
     * 상태 변경
     */
    public void updateStatus(String status) {
        this.status = status;
    }

    /**
     * 끌어올리기
     */
    public void bump() {
        this.bumpedAt = LocalDateTime.now();
    }
}
