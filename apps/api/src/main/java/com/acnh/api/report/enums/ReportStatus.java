package com.acnh.api.report.enums;

/**
 * 신고 처리 상태
 * - PENDING: 대기 중 (미처리)
 * - REVIEWED: 검토 완료
 * - RESOLVED: 처리 완료
 */
public enum ReportStatus {
    PENDING,
    REVIEWED,
    RESOLVED
}
