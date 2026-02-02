package com.acnh.api.keywordalarm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 키워드 알림 생성 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class KeywordAlarmCreateRequest {

    @NotBlank(message = "키워드를 입력해주세요")
    @Size(min = 1, max = 50, message = "키워드는 1~50자 이내로 입력해주세요")
    private String keyword;
}
