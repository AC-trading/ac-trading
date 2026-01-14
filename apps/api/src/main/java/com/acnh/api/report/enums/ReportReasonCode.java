package com.acnh.api.report.enums;

/**
 * 신고 사유 코드
 * - HACKED_ITEM: 해킹 아이템 (불법 복제/변조 아이템)
 * - DUPLICATE_POST: 중복 게시글
 * - ABUSIVE_LANGUAGE: 욕설/비방
 * - REAL_MONEY_TRADE: 현금 거래 시도
 * - SCAM: 사기
 * - EXTERNAL_MESSENGER: 외부 메신저 유도
 * - OTHER: 기타
 */
public enum ReportReasonCode {
    HACKED_ITEM,
    DUPLICATE_POST,
    ABUSIVE_LANGUAGE,
    REAL_MONEY_TRADE,
    SCAM,
    EXTERNAL_MESSENGER,
    OTHER
}
