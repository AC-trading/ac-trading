package com.acnh.api.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 신고 생성 요청 DTO
 */
@Getter
@NoArgsConstructor
public class ReportCreateRequest {

    @NotNull(message = "게시글 ID는 필수입니다")
    private Long postId;

    @NotBlank(message = "신고 사유 코드는 필수입니다")
    @Pattern(regexp = "^(HACKED_ITEM|DUPLICATE_POST|ABUSIVE_LANGUAGE|REAL_MONEY_TRADE|SCAM|EXTERNAL_MESSENGER|OTHER)$",
            message = "유효하지 않은 신고 사유 코드입니다")
    private String reasonCode;

    @Size(max = 1000, message = "상세 설명은 1000자 이내로 입력해주세요")
    private String description;

    // 신고 후 해당 사용자 차단 여부 (프론트에서 "차단하시겠습니까?" 응답)
    private Boolean blockUser;
}
