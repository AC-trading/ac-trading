package com.acnh.api.priceoffer.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 가격 제안 Entity
 * - price_offers 테이블 매핑
 * - 구매자가 게시글에 가격을 제안할 때 생성
 */
@Entity
@Table(name = "price_offers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PriceOffer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 제안 대상 게시글
    @Column(name = "post_id", nullable = false)
    private Long postId;

    // 제안자 (구매 희망자)
    @Column(name = "offerer_id", nullable = false)
    private Long offererId;

    // 게시글 작성자 (제안 받는 사람)
    @Column(name = "post_owner_id", nullable = false)
    private Long postOwnerId;

    // 제안 가격
    @Column(name = "offered_price", nullable = false)
    private Integer offeredPrice;

    // 화폐 유형 (BELL, MILE_TICKET)
    @Column(name = "currency_type", length = 20)
    private String currencyType;

    // 제안 상태 (PENDING, ACCEPTED, REJECTED)
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Builder
    public PriceOffer(Long postId, Long offererId, Long postOwnerId,
                      Integer offeredPrice, String currencyType) {
        this.postId = postId;
        this.offererId = offererId;
        this.postOwnerId = postOwnerId;
        this.offeredPrice = offeredPrice;
        this.currencyType = currencyType;
        this.status = "PENDING";
    }

    /**
     * 제안 수락
     */
    public void accept() {
        if (!"PENDING".equals(this.status)) {
            throw new IllegalStateException("대기 중인 제안만 수락할 수 있습니다");
        }
        this.status = "ACCEPTED";
    }

    /**
     * 제안 거절
     */
    public void reject() {
        if (!"PENDING".equals(this.status)) {
            throw new IllegalStateException("대기 중인 제안만 거절할 수 있습니다");
        }
        this.status = "REJECTED";
    }
}
