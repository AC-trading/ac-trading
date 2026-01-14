package com.acnh.api.member.controller;

import com.acnh.api.member.dto.MemberResponse;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * 회원 관련 API 컨트롤러
 * - /api/users/me: 현재 로그인한 사용자 정보 조회
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class MemberController {

    private final MemberRepository memberRepository;

    /**
     * 현재 로그인한 사용자 정보 조회
     * - JWT에서 추출한 userId로 회원 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<MemberResponse> getCurrentUser(@AuthenticationPrincipal String userId) {
        log.info("사용자 정보 조회 요청 - userId: {}", userId);

        if (userId == null) {
            log.warn("인증되지 않은 요청입니다.");
            return ResponseEntity.status(401).build();
        }

        return memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(userId))
                .map(member -> {
                    // Before: log.info("사용자 정보 조회 성공 - email: {}", member.getEmail());
                    // After: PII(이메일) 로깅 제거 - userId만 로깅하여 개인정보 보호
                    log.info("사용자 정보 조회 성공 - userId: {}", userId);
                    return ResponseEntity.ok(MemberResponse.from(member));
                })
                .orElseGet(() -> {
                    log.warn("사용자를 찾을 수 없습니다 - userId: {}", userId);
                    return ResponseEntity.notFound().build();
                });
    }
}
