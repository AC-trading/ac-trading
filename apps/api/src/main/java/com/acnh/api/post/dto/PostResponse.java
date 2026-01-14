package com.acnh.api.post.dto;

import com.acnh.api.post.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 게시글 목록/상세 응답 DTO
 */
@Getter
@Builder
public class PostResponse {

    private Long id;
    private Long userId;
    private String userNickname;
    private String userIslandName;
    private Integer userMannerScore;

    private String postType;  // SELL, BUY
    private String status;    // AVAILABLE, RESERVED, COMPLETED

    private Long categoryId;
    private String categoryName;

    private String itemName;
    private String currencyType;  // BELL, MILE_TICKET
    private Integer price;
    private Boolean priceNegotiable;
    private String description;

    private Integer likeCount;
    private Boolean isLiked;  // 현재 사용자가 찜했는지

    private LocalDateTime bumpedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Entity -> DTO 변환 (기본)
     */
    public static PostResponse from(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .postType(post.getPostType())
                .status(post.getStatus())
                .categoryId(post.getCategoryId())
                .itemName(post.getItemName())
                .currencyType(post.getCurrencyType())
                .price(post.getPrice())
                .priceNegotiable(post.getPriceNegotiable())
                .description(post.getDescription())
                .likeCount(post.getLikeCount())
                .isLiked(false)
                .bumpedAt(post.getBumpedAt())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    /**
     * Entity -> DTO 변환 (유저 정보, 카테고리명, 찜 여부 포함)
     */
    public static PostResponse from(Post post, String userNickname, String userIslandName,
                                    Integer userMannerScore, String categoryName, Boolean isLiked) {
        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .userNickname(userNickname)
                .userIslandName(userIslandName)
                .userMannerScore(userMannerScore)
                .postType(post.getPostType())
                .status(post.getStatus())
                .categoryId(post.getCategoryId())
                .categoryName(categoryName)
                .itemName(post.getItemName())
                .currencyType(post.getCurrencyType())
                .price(post.getPrice())
                .priceNegotiable(post.getPriceNegotiable())
                .description(post.getDescription())
                .likeCount(post.getLikeCount())
                .isLiked(isLiked != null ? isLiked : false)
                .bumpedAt(post.getBumpedAt())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
