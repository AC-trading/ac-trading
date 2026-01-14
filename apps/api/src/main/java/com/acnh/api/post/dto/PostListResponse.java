package com.acnh.api.post.dto;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 게시글 목록 페이징 응답 DTO
 */
@Getter
@Builder
public class PostListResponse {

    private List<PostResponse> posts;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
    private boolean hasPrevious;

    /**
     * Page -> DTO 변환
     */
    public static PostListResponse from(Page<PostResponse> page) {
        return PostListResponse.builder()
                .posts(page.getContent())
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
