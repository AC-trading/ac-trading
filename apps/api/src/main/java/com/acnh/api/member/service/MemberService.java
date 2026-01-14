package com.acnh.api.member.service;

import com.acnh.api.member.dto.ProfileSetupRequest;
import com.acnh.api.member.dto.ProfileUpdateRequest;
import com.acnh.api.member.dto.MemberProfileResponse;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 회원 관련 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final ReviewRepository reviewRepository;

    /**
     * 내 프로필 조회
     */
    public MemberProfileResponse getMyProfile(String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Long reviewCount = reviewRepository.countByRevieweeIdAndDeletedAtIsNull(member.getId());
        return MemberProfileResponse.from(member, reviewCount);
    }

    /**
     * 특정 유저 프로필 조회
     */
    public MemberProfileResponse getMemberProfile(UUID targetMemberId) {
        Member member = memberRepository.findByUuidAndDeletedAtIsNull(targetMemberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
        Long reviewCount = reviewRepository.countByRevieweeIdAndDeletedAtIsNull(member.getId());
        return MemberProfileResponse.from(member, reviewCount);
    }

    /**
     * 프로필 수정
     * - 24시간 제한 적용
     */
    @Transactional
    public MemberProfileResponse updateProfile(String visitorId, ProfileUpdateRequest request) {
        Member member = findMemberByUuid(visitorId);

        // 24시간 제한 체크
        if (!member.canUpdateProfile()) {
            LocalDateTime nextAvailable = member.getNextProfileUpdateAvailableAt();
            throw new IllegalStateException(
                    String.format("프로필은 24시간에 한 번만 수정할 수 있습니다. 다음 수정 가능 시간: %s", nextAvailable)
            );
        }

        member.updateProfile(
                request.getNickname(),
                request.getIslandName(),
                request.getDreamAddress(),
                member.getHemisphere() // 반구는 수정 불가
        );

        log.info("프로필 수정 완료 - memberId: {}", visitorId);
        Long reviewCount = reviewRepository.countByRevieweeIdAndDeletedAtIsNull(member.getId());
        return MemberProfileResponse.from(member, reviewCount);
    }

    /**
     * 신규 유저 프로필 초기 설정
     * - 24시간 제한 없음
     */
    @Transactional
    public MemberProfileResponse setupProfile(String visitorId, ProfileSetupRequest request) {
        Member member = findMemberByUuid(visitorId);

        member.setupProfile(
                request.getNickname(),
                request.getIslandName(),
                request.getDreamAddress(),
                request.getHemisphere()
        );

        log.info("프로필 초기 설정 완료 - memberId: {}", visitorId);
        Long reviewCount = reviewRepository.countByRevieweeIdAndDeletedAtIsNull(member.getId());
        return MemberProfileResponse.from(member, reviewCount);
    }

    /**
     * 회원 탈퇴 (soft delete)
     */
    @Transactional
    public void deleteAccount(String visitorId) {
        Member member = findMemberByUuid(visitorId);
        member.delete();
        log.info("회원 탈퇴 처리 완료 - memberId: {}", visitorId);
    }

    /**
     * UUID로 회원 조회 (공통 메서드)
     */
    private Member findMemberByUuid(String visitorId) {
        return memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(visitorId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }
}
