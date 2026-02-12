package com.acnh.api.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 예약자 지정 요청 DTO
 */
@Getter
@NoArgsConstructor
public class ReserveRequest {

    // 거래 예정 일시 (선택)
    private LocalDateTime scheduledTradeAt;
}
