package com.acnh.api.report.dto;

import com.acnh.api.report.entity.Report;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 신고 응답 DTO
 */
@Getter
@Builder
public class ReportResponse {

    private Long id;
    private String status;
    private LocalDateTime createdAt;

    /**
     * Entity -> DTO 변환
     */
    public static ReportResponse from(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
