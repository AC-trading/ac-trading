package com.acnh.api.block.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 차단 목록 응답 DTO
 */
@Getter
@Builder
public class BlockListResponse {

    private List<BlockResponse> blocks;
    private int totalCount;

    public static BlockListResponse from(List<BlockResponse> blocks) {
        return BlockListResponse.builder()
                .blocks(blocks)
                .totalCount(blocks.size())
                .build();
    }
}
