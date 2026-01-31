package com.acnh.api.transaction.entity;

import com.acnh.api.common.entity.BaseEntity;
import com.acnh.api.post.enums.CurrencyType;
import com.acnh.api.transaction.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 거래 내역 엔티티
 * - 사용자의 구매/판매 거래 기록 저장
 */
@Entity
@Table(name = "transactions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Transaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "post_id")
    private Long postId;  // 연관 게시글 (선택)

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 10)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "currency_type", nullable = false, length = 20)
    private CurrencyType currencyType;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Column(name = "partner_id")
    private Long partnerId;  // 거래 상대방 ID (선택)

    @Column(name = "partner_nickname", length = 50)
    private String partnerNickname;

    @Column(name = "memo", length = 500)
    private String memo;

    @Column(name = "traded_at", nullable = false)
    private LocalDateTime tradedAt;
}
