package com.acnh.api.priceoffer.controller;

import com.acnh.api.priceoffer.dto.PriceOfferAcceptResponse;
import com.acnh.api.priceoffer.dto.PriceOfferCreateRequest;
import com.acnh.api.priceoffer.dto.PriceOfferResponse;
import com.acnh.api.priceoffer.service.PriceOfferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 가격 제안 API 컨트롤러
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class PriceOfferController {

    private final PriceOfferService priceOfferService;

    /**
     * 가격 제안하기
     * POST /api/posts/{postId}/price-offer
     * - 가격제안 받기(priceNegotiable)가 true인 게시글만 가능
     */
    @PostMapping("/api/posts/{postId}/price-offer")
    public ResponseEntity<?> createPriceOffer(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long postId,
            @Valid @RequestBody PriceOfferCreateRequest request) {

        log.info("가격 제안 요청 - postId: {}, visitorId: {}", postId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            PriceOfferResponse response = priceOfferService.createPriceOffer(postId, request, visitorId);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("존재하지 않는")) {
                return ResponseEntity.status(404).body(Map.of(
                        "error", "NOT_FOUND",
                        "message", e.getMessage()
                ));
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_REQUEST",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 가격 제안 수락
     * POST /api/price-offers/{offerId}/accept
     * - 게시글 작성자만 수락 가능
     * - 수락 시 채팅방 생성
     */
    @PostMapping("/api/price-offers/{offerId}/accept")
    public ResponseEntity<?> acceptPriceOffer(
            @AuthenticationPrincipal String visitorId,
            @PathVariable Long offerId) {

        log.info("가격 제안 수락 요청 - offerId: {}, visitorId: {}", offerId, visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "로그인이 필요합니다"
            ));
        }

        try {
            PriceOfferAcceptResponse response = priceOfferService.acceptPriceOffer(offerId, visitorId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("존재하지 않는")) {
                return ResponseEntity.status(404).body(Map.of(
                        "error", "NOT_FOUND",
                        "message", e.getMessage()
                ));
            }
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_REQUEST",
                    "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            // 이미 처리된 제안
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_STATE",
                    "message", e.getMessage()
            ));
        }
    }
}
