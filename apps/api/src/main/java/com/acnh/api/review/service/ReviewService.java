package com.acnh.api.review.service;

import com.acnh.api.chat.repository.ChatRoomRepository;
import com.acnh.api.filter.ProfanityFilter;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.post.entity.Post;
import com.acnh.api.post.repository.PostRepository;
import com.acnh.api.review.dto.ReviewCreateRequest;
import com.acnh.api.review.dto.ReviewListResponse;
import com.acnh.api.review.dto.ReviewResponse;
import com.acnh.api.review.entity.Review;
import com.acnh.api.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 리뷰 관련 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final MemberRepository memberRepository;
    private final PostRepository postRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ProfanityFilter profanityFilter;

    /**
     * 리뷰 작성
     * - 해당 게시글에 채팅 기록이 있는 경우만 평가 가능
     * - (post_id, reviewer_id) 조합으로 1회만 리뷰 가능
     */
    @Transactional
    public ReviewResponse createReview(ReviewCreateRequest request, String visitorId) {
        Member reviewer = findMemberByUuid(visitorId);
        Post post = findPostById(request.getPostId());
        Member reviewee = findMemberById(request.getRevieweeId());

        // 자기 자신에게 리뷰 불가
        if (reviewer.getId().equals(reviewee.getId())) {
            throw new IllegalArgumentException("자기 자신에게 리뷰를 작성할 수 없습니다");
        }

        // 채팅 기록 확인 (리뷰어가 해당 게시글에 채팅방이 있는지)
        validateChatHistory(post, reviewer);

        // 리뷰 대상자 유효성 검증
        validateRevieweeEligibility(post, reviewer, reviewee);

        // 중복 리뷰 검사 (post_id + reviewer_id 기준)
        if (reviewRepository.existsByPostIdAndReviewerIdAndDeletedAtIsNull(post.getId(), reviewer.getId())) {
            throw new IllegalArgumentException("이미 해당 게시글에 리뷰를 작성하였습니다");
        }

        // 금칙어 검사
        if (request.getComment() != null && !request.getComment().isBlank()) {
            profanityFilter.validateText(request.getComment());
        }

        Review review = Review.builder()
                .postId(post.getId())
                .reviewerId(reviewer.getId())
                .revieweeId(reviewee.getId())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);
        log.info("리뷰 작성 완료 - reviewId: {}, postId: {}, reviewerId: {}, revieweeId: {}",
                savedReview.getId(), post.getId(), reviewer.getId(), reviewee.getId());

        return toReviewResponse(savedReview);
    }

    /**
     * 유저가 받은 리뷰 목록 조회
     */
    public ReviewListResponse getReviewsByUserId(Long userId, Pageable pageable) {
        // 유저 존재 확인
        findMemberById(userId);

        Page<Review> reviews = reviewRepository.findByRevieweeIdAndDeletedAtIsNull(userId, pageable);

        // 관련 데이터 일괄 조회
        List<Long> reviewerIds = reviews.stream().map(Review::getReviewerId).distinct().toList();
        List<Long> postIds = reviews.stream().map(Review::getPostId).distinct().toList();

        // 빈 리스트일 경우 불필요한 DB 조회 방지
        Map<Long, Member> memberMap = reviewerIds.isEmpty()
                ? Collections.emptyMap()
                : memberRepository.findByIdInAndDeletedAtIsNull(reviewerIds)
                        .stream()
                        .collect(Collectors.toMap(Member::getId, Function.identity()));

        Map<Long, Post> postMap = postIds.isEmpty()
                ? Collections.emptyMap()
                : postRepository.findByIdInAndDeletedAtIsNull(postIds)
                        .stream()
                        .collect(Collectors.toMap(Post::getId, Function.identity()));

        // 리뷰 대상자 정보 조회
        Member reviewee = memberRepository.findByIdAndDeletedAtIsNull(userId).orElse(null);
        String revieweeNickname = reviewee != null ? reviewee.getNickname() : "알 수 없음";

        Page<ReviewResponse> responsePage = reviews.map(review -> {
            Member reviewer = memberMap.get(review.getReviewerId());
            Post post = postMap.get(review.getPostId());

            String reviewerNickname = reviewer != null ? reviewer.getNickname() : "알 수 없음";
            String reviewerIslandName = reviewer != null ? reviewer.getIslandName() : null;
            String postItemName = post != null ? post.getItemName() : null;

            return ReviewResponse.from(review, reviewerNickname, reviewerIslandName,
                    revieweeNickname, postItemName);
        });

        // 통계 정보 조회
        Double averageRating = reviewRepository.calculateAverageRatingByRevieweeId(userId);
        long reviewCount = reviewRepository.countByRevieweeIdAndDeletedAtIsNull(userId);

        return ReviewListResponse.from(responsePage, averageRating, reviewCount);
    }

    /**
     * 리뷰 작성 가능 여부 확인
     * - 해당 게시글에 채팅 기록이 있고, 아직 리뷰를 작성하지 않았는지 확인
     */
    public boolean canWriteReview(Long postId, String visitorId) {
        if (visitorId == null) {
            return false;
        }

        // UUID 파싱 실패 시 false 반환
        UUID uuid;
        try {
            uuid = UUID.fromString(visitorId);
        } catch (IllegalArgumentException e) {
            return false;
        }

        Member member = memberRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElse(null);
        if (member == null) {
            return false;
        }

        Post post = postRepository.findByIdAndDeletedAtIsNull(postId).orElse(null);
        if (post == null) {
            return false;
        }

        // 이미 리뷰 작성했는지 확인
        if (reviewRepository.existsByPostIdAndReviewerIdAndDeletedAtIsNull(postId, member.getId())) {
            return false;
        }

        // 채팅 기록 확인
        // 게시글 작성자인 경우: 해당 게시글에 채팅방이 있으면 리뷰 가능
        if (post.getUserId().equals(member.getId())) {
            return !chatRoomRepository.findByPostIdAndDeletedAtIsNull(postId).isEmpty();
        }

        // 채팅 요청자인 경우: 해당 게시글에 본인이 신청한 채팅방이 있으면 리뷰 가능
        return chatRoomRepository.existsByPostIdAndApplicantIdAndDeletedAtIsNull(postId, member.getId());
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
     * ID로 회원 조회
     */
    private Member findMemberById(Long memberId) {
        return memberRepository.findByIdAndDeletedAtIsNull(memberId)
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
     * 채팅 기록 검증
     * - 게시글 작성자: 해당 게시글에 채팅방이 존재해야 함
     * - 채팅 요청자: 해당 게시글에 본인이 신청한 채팅방이 존재해야 함
     */
    private void validateChatHistory(Post post, Member reviewer) {
        // 게시글 작성자인 경우
        if (post.getUserId().equals(reviewer.getId())) {
            if (chatRoomRepository.findByPostIdAndDeletedAtIsNull(post.getId()).isEmpty()) {
                throw new IllegalArgumentException("해당 게시글에 채팅 기록이 없습니다");
            }
            return;
        }

        // 채팅 요청자인 경우
        if (!chatRoomRepository.existsByPostIdAndApplicantIdAndDeletedAtIsNull(post.getId(), reviewer.getId())) {
            throw new IllegalArgumentException("해당 게시글에 채팅 기록이 없습니다");
        }
    }

    /**
     * 리뷰 대상자 유효성 검증
     * - 채팅 요청자 → 게시글 작성자에게만 리뷰 가능
     * - 게시글 작성자 → 채팅 요청자에게만 리뷰 가능
     */
    private void validateRevieweeEligibility(Post post, Member reviewer, Member reviewee) {
        // 채팅 요청자가 리뷰하는 경우: 게시글 작성자에게만 리뷰 가능
        if (!post.getUserId().equals(reviewer.getId())) {
            if (!post.getUserId().equals(reviewee.getId())) {
                throw new IllegalArgumentException("게시글 작성자에게만 리뷰를 작성할 수 있습니다");
            }
            return;
        }

        // 게시글 작성자가 리뷰하는 경우: 해당 게시글에 채팅을 요청한 유저에게만 리뷰 가능
        if (!chatRoomRepository.existsByPostIdAndApplicantIdAndDeletedAtIsNull(post.getId(), reviewee.getId())) {
            throw new IllegalArgumentException("해당 게시글에 채팅을 요청한 유저에게만 리뷰를 작성할 수 있습니다");
        }
    }

    /**
     * Review -> ReviewResponse 변환
     */
    private ReviewResponse toReviewResponse(Review review) {
        Member reviewer = memberRepository.findByIdAndDeletedAtIsNull(review.getReviewerId()).orElse(null);
        Member reviewee = memberRepository.findByIdAndDeletedAtIsNull(review.getRevieweeId()).orElse(null);
        Post post = postRepository.findByIdAndDeletedAtIsNull(review.getPostId()).orElse(null);

        String reviewerNickname = reviewer != null ? reviewer.getNickname() : "알 수 없음";
        String reviewerIslandName = reviewer != null ? reviewer.getIslandName() : null;
        String revieweeNickname = reviewee != null ? reviewee.getNickname() : "알 수 없음";
        String postItemName = post != null ? post.getItemName() : null;

        return ReviewResponse.from(review, reviewerNickname, reviewerIslandName,
                revieweeNickname, postItemName);
    }
}
