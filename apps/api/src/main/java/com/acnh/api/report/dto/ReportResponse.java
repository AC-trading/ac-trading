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

    // 차단 처리 여부 (신고 시 차단도 함께 했는지)
    private Boolean blocked;
    // 피신고자 ID (프론트에서 차단 확인용)
    private Long reportedUserId;

    /**
     * Entity -> DTO 변환
     */
    public static ReportResponse from(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .blocked(false)
                .reportedUserId(report.getReportedUserId())
                .build();
    }

    /**
     * Entity -> DTO 변환 (차단 여부 포함)
     */
    public static ReportResponse from(Report report, boolean blocked) {
        return ReportResponse.builder()
                .id(report.getId())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .blocked(blocked)
                .reportedUserId(report.getReportedUserId())
                .build();
    }
}
