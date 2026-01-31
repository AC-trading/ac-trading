package com.acnh.api.transaction.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 거래 내역 생성 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionCreateRequest {

    private Long postId;  // 연관 게시글 (선택)

    @NotBlank(message = "아이템명을 입력해주세요")
    @Size(max = 100, message = "아이템명은 100자 이내로 입력해주세요")
    private String itemName;

    @NotNull(message = "거래 유형을 선택해주세요")
    private String type;  // SALE, PURCHASE

    @NotNull(message = "화폐 종류를 선택해주세요")
    private String currencyType;  // BELL, MILE_TICKET

    @NotNull(message = "금액을 입력해주세요")
    @Min(value = 0, message = "금액은 0 이상이어야 합니다")
    private Integer amount;

    @Size(max = 50, message = "상대방 닉네임은 50자 이내로 입력해주세요")
    private String partnerNickname;

    @Size(max = 500, message = "메모는 500자 이내로 입력해주세요")
    private String memo;

    private LocalDateTime tradedAt;  // 거래 일시 (미입력 시 현재 시간)
}
