package com.acnh.api.block.dto;

import com.acnh.api.block.entity.Block;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 차단 응답 DTO
 */
@Getter
@Builder
public class BlockResponse {

    private Long id;
    private Long blockedUserId;
    private String blockedUserNickname;
    private String reason;
    private LocalDateTime createdAt;

    public static BlockResponse from(Block block, String blockedUserNickname) {
        return BlockResponse.builder()
                .id(block.getId())
                .blockedUserId(block.getBlockedId())
                .blockedUserNickname(blockedUserNickname)
                .reason(block.getReason())
                .createdAt(block.getCreatedAt())
                .build();
    }
}
