package com.acnh.api.member.controller;

import com.acnh.api.member.dto.ProfileSetupRequest;
import com.acnh.api.member.dto.ProfileUpdateRequest;
import com.acnh.api.member.dto.MemberProfileResponse;
import com.acnh.api.member.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * 회원 관련 API 컨트롤러
 * - 프로필 조회/수정/설정, 회원 탈퇴
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    /**
     * 내 프로필 조회
     * GET /api/users/me
     */
    @GetMapping("/me")
    public ResponseEntity<MemberProfileResponse> getMyProfile(@AuthenticationPrincipal String visitorId) {
        log.info("내 프로필 조회 요청 - visitorId: {}", visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).build();
        }

        MemberProfileResponse response = memberService.getMyProfile(visitorId);
        return ResponseEntity.ok(response);
    }

    /**
     * 프로필 수정
     * POST /api/users/me/update
     * - 24시간에 한 번만 수정 가능
     */
    @PostMapping("/me/update")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal String visitorId,
            @Valid @RequestBody ProfileUpdateRequest request) {
        log.info("프로필 수정 요청 - visitorId: {}", visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            MemberProfileResponse response = memberService.updateProfile(visitorId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            // 24시간 제한 에러
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "PROFILE_UPDATE_LIMIT",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * 신규 유저 프로필 초기 설정
     * POST /api/users/me/profile-setup
     * - 닉네임, 섬 이름 필수
     * - 반구, 꿈번지 선택
     */
    @PostMapping("/me/profile-setup")
    public ResponseEntity<MemberProfileResponse> setupProfile(
            @AuthenticationPrincipal String visitorId,
            @Valid @RequestBody ProfileSetupRequest request) {
        log.info("프로필 초기 설정 요청 - visitorId: {}", visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).build();
        }

        MemberProfileResponse response = memberService.setupProfile(visitorId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 회원 탈퇴 (soft delete)
     * POST /api/users/me/delete
     */
    @PostMapping("/me/delete")
    public ResponseEntity<Map<String, String>> deleteAccount(@AuthenticationPrincipal String visitorId) {
        log.info("회원 탈퇴 요청 - visitorId: {}", visitorId);

        if (visitorId == null) {
            return ResponseEntity.status(401).build();
        }

        memberService.deleteAccount(visitorId);
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다"));
    }

    /**
     * 특정 유저 프로필 조회
     * GET /api/users/{memberId}
     */
    @GetMapping("/{targetMemberId}")
    public ResponseEntity<MemberProfileResponse> getMemberProfile(
            @AuthenticationPrincipal String visitorId,
            @PathVariable UUID targetMemberId) {
        log.info("유저 프로필 조회 요청 - visitorId: {}, targetMemberId: {}", visitorId, targetMemberId);

        if (visitorId == null) {
            return ResponseEntity.status(401).build();
        }

        MemberProfileResponse response = memberService.getMemberProfile(targetMemberId);
        return ResponseEntity.ok(response);
    }
}
