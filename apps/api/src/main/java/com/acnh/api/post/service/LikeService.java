package com.acnh.api.post.service;

import com.acnh.api.category.entity.Category;
import com.acnh.api.category.repository.CategoryRepository;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.post.dto.LikeResponse;
import com.acnh.api.post.dto.PostListResponse;
import com.acnh.api.post.dto.PostResponse;
import com.acnh.api.post.entity.Post;
import com.acnh.api.post.entity.PostLike;
import com.acnh.api.post.repository.PostLikeRepository;
import com.acnh.api.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * 찜(좋아요) 관련 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final MemberRepository memberRepository;
    private final CategoryRepository categoryRepository;

    /**
     * 내 찜 목록 조회
     */
    public PostListResponse getMyLikes(String visitorId, Pageable pageable) {
        Member member = findMemberByUuid(visitorId);

        // 찜 목록 조회
        Page<PostLike> likes = postLikeRepository.findByUserIdAndDeletedAtIsNull(member.getId(), pageable);

        // PostLike -> PostResponse 변환 (삭제된 게시글은 null 반환)
        List<PostResponse> responses = likes.getContent().stream()
                .map(like -> {
                    Post post = postRepository.findByIdAndDeletedAtIsNull(like.getPostId()).orElse(null);
                    if (post == null) {
                        return null;
                    }
                    return toPostResponse(post, member.getId());
                })
                .filter(Objects::nonNull)
                .toList();

        // null 필터링된 결과로 새 Page 생성
        Page<PostResponse> filteredPage = new PageImpl<>(responses, pageable, likes.getTotalElements());

        return PostListResponse.from(filteredPage);
    }

    /**
     * 게시글 찜하기
     */
    @Transactional
    public LikeResponse likePost(Long postId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Post post = findPostById(postId);

        // 이미 찜한 경우 체크
        if (postLikeRepository.existsByPostIdAndUserIdAndDeletedAtIsNull(postId, member.getId())) {
            throw new IllegalStateException("이미 찜한 게시글입니다");
        }

        // 찜 생성
        PostLike like = PostLike.builder()
                .postId(postId)
                .userId(member.getId())
                .build();
        postLikeRepository.save(like);

        // 게시글 좋아요 수 증가
        postRepository.increaseLikeCount(postId);

        // 최신 좋아요 수 조회
        int likeCount = post.getLikeCount() + 1;

        log.info("게시글 찜하기 완료 - postId: {}, userId: {}", postId, member.getId());

        return LikeResponse.of(postId, likeCount, true);
    }

    /**
     * 게시글 찜 취소
     */
    @Transactional
    public LikeResponse unlikePost(Long postId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Post post = findPostById(postId);

        // 찜 기록 조회
        PostLike like = postLikeRepository.findByPostIdAndUserIdAndDeletedAtIsNull(postId, member.getId())
                .orElseThrow(() -> new IllegalStateException("찜하지 않은 게시글입니다"));

        // 찜 삭제 (soft delete)
        like.delete();

        // 게시글 좋아요 수 감소
        postRepository.decreaseLikeCount(postId);

        // 최신 좋아요 수 조회
        int likeCount = Math.max(0, post.getLikeCount() - 1);

        log.info("게시글 찜 취소 완료 - postId: {}, userId: {}", postId, member.getId());

        return LikeResponse.of(postId, likeCount, false);
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
     * Post -> PostResponse 변환 (유저 정보, 카테고리명, 찜 여부 포함)
     */
    private PostResponse toPostResponse(Post post, Long currentUserId) {
        // 게시글 작성자 정보 조회
        Member author = memberRepository.findByIdAndDeletedAtIsNull(post.getUserId()).orElse(null);
        String nickname = author != null ? author.getNickname() : "알 수 없음";
        String islandName = author != null ? author.getIslandName() : null;
        Integer mannerScore = author != null ? author.getMannerScore() : null;

        // 카테고리명 조회
        Category category = categoryRepository.findByIdAndDeletedAtIsNull(post.getCategoryId()).orElse(null);
        String categoryName = category != null ? category.getName() : null;

        // 찜 목록에서 조회한 것이므로 isLiked는 항상 true
        return PostResponse.from(post, nickname, islandName, mannerScore, categoryName, true);
    }
}
