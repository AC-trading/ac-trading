package com.acnh.api.block.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 차단 요청 DTO
 */
@Getter
@NoArgsConstructor
public class BlockRequest {

    @NotNull(message = "차단할 사용자 ID는 필수입니다")
    private Long blockedUserId;

    // 차단 사유 (선택)
    private String reason;
}
