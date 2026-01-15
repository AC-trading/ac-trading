package com.acnh.api.report.service;

import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.post.entity.Post;
import com.acnh.api.post.repository.PostRepository;
import com.acnh.api.report.dto.ReportCreateRequest;
import com.acnh.api.report.dto.ReportResponse;
import com.acnh.api.report.entity.Report;
import com.acnh.api.report.enums.ReportReasonCode;
import com.acnh.api.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 신고 관련 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;

    /**
     * 신고하기
     */
    @Transactional
    public ReportResponse createReport(ReportCreateRequest request, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Post post = findPostById(request.getPostId());

        // 신고 사유 코드 유효성 검증
        validateReasonCode(request.getReasonCode());

        // 본인 게시글은 신고할 수 없음
        if (post.getUserId().equals(member.getId())) {
            throw new IllegalArgumentException("본인의 게시글은 신고할 수 없습니다");
        }

        // 신고 생성
        Report report = Report.builder()
                .reporterId(member.getId())
                .postId(request.getPostId())
                .reasonCode(request.getReasonCode())
                .description(request.getDescription())
                .build();

        Report savedReport = reportRepository.save(report);

        log.info("신고 생성 완료 - reportId: {}, postId: {}, reporterId: {}, reasonCode: {}",
                savedReport.getId(), request.getPostId(), member.getId(), request.getReasonCode());

        return ReportResponse.from(savedReport);
    }

    // ========== Private Helper Methods ==========

    /**
     * UUID로 회원 조회
     */
    private Member findMemberByUuid(String visitorId) {
        if (visitorId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다");
        }
        return memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(visitorId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }

    /**
     * 게시글 ID로 조회
     */
    private Post findPostById(Long postId) {
        return postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다"));
    }

    /**
     * 신고 사유 코드 유효성 검증
     */
    private void validateReasonCode(String reasonCode) {
        if (reasonCode == null || reasonCode.isBlank()) {
            throw new IllegalArgumentException("신고 사유 코드는 필수입니다");
        }
        try {
            ReportReasonCode.valueOf(reasonCode.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 신고 사유 코드입니다: " + reasonCode);
        }
    }
}
