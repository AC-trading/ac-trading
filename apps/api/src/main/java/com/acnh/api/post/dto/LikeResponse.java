package com.acnh.api.post.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 찜 응답 DTO
 * - 찜하기/취소 시 반환
 */
@Getter
@Builder
public class LikeResponse {

    private Long postId;
    private Integer likeCount;
    private Boolean isLiked;

    public static LikeResponse of(Long postId, Integer likeCount, Boolean isLiked) {
        return LikeResponse.builder()
                .postId(postId)
                .likeCount(likeCount)
                .isLiked(isLiked)
                .build();
    }
}
