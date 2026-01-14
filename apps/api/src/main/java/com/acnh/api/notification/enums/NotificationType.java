package com.acnh.api.notification.enums;

/**
 * 알림 유형
 * - CHAT_NEW_MESSAGE: 새 채팅 메시지
 * - CHAT_NEW_REQUEST: 새 채팅 요청
 * - PRICE_OFFER_RECEIVED: 가격 제안 받음
 * - TRADE_RESERVED: 거래 예약됨
 * - TRADE_COMPLETED: 거래 완료됨
 * - TRADE_REMINDER: 거래 리마인더
 * - LIKE_PRICE_CHANGED: 찜한 상품 가격 변경
 * - LIKE_STATUS_CHANGED: 찜한 상품 상태 변경
 * - REVIEW_RECEIVED: 리뷰 수신
 */
public enum NotificationType {
    CHAT_NEW_MESSAGE,
    CHAT_NEW_REQUEST,
    PRICE_OFFER_RECEIVED,
    TRADE_RESERVED,
    TRADE_COMPLETED,
    TRADE_REMINDER,
    LIKE_PRICE_CHANGED,
    LIKE_STATUS_CHANGED,
    REVIEW_RECEIVED
}
