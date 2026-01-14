package com.acnh.api.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 게시글 상태 변경 요청 DTO
 */
@Getter
@NoArgsConstructor
public class PostStatusUpdateRequest {

    @NotBlank(message = "상태는 필수입니다")
    @Pattern(regexp = "^(AVAILABLE|RESERVED|COMPLETED)$", message = "상태는 AVAILABLE, RESERVED, COMPLETED만 가능합니다")
    private String status;
}
