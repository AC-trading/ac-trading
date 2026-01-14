package com.acnh.api.post.service;

import com.acnh.api.category.entity.Category;
import com.acnh.api.category.repository.CategoryRepository;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import com.acnh.api.post.dto.*;
import com.acnh.api.post.entity.Post;
import com.acnh.api.post.enums.CurrencyType;
import com.acnh.api.post.enums.PostStatus;
import com.acnh.api.post.enums.PostType;
import com.acnh.api.post.repository.PostLikeRepository;
import com.acnh.api.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 게시글 관련 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final MemberRepository memberRepository;
    private final CategoryRepository categoryRepository;

    // 끌어올리기 제한 시간 (3일 = 72시간)
    private static final int BUMP_LIMIT_HOURS = 72;

    /**
     * 게시글 목록 조회 (피드)
     * - bumped_at 우선 정렬
     * - 필터: 카테고리, 게시글유형, 상태, 가격범위
     */
    public PostListResponse getFeed(Long categoryId, String postType, String status,
                                    Integer minPrice, Integer maxPrice,
                                    String visitorId, Pageable pageable) {
        // 필터 값 유효성 검증
        String validPostType = validatePostType(postType);
        String validStatus = validateStatus(status);

        Page<Post> posts = postRepository.findFeed(categoryId, validPostType, validStatus, minPrice, maxPrice, pageable);

        Long currentUserId = getCurrentUserId(visitorId);
        Page<PostResponse> responsePage = posts.map(post -> toPostResponse(post, currentUserId));

        return PostListResponse.from(responsePage);
    }

    /**
     * 게시글 검색
     * - 아이템명 LIKE 검색
     * - 필터: 카테고리, 게시글유형, 상태, 가격범위
     */
    public PostListResponse searchPosts(String keyword, Long categoryId, String postType,
                                        String status, Integer minPrice, Integer maxPrice,
                                        String visitorId, Pageable pageable) {
        if (keyword == null || keyword.isBlank()) {
            throw new IllegalArgumentException("검색어를 입력해주세요");
        }

        String validPostType = validatePostType(postType);
        String validStatus = validateStatus(status);

        Page<Post> posts = postRepository.searchByKeyword(keyword, categoryId, validPostType, validStatus, minPrice, maxPrice, pageable);

        Long currentUserId = getCurrentUserId(visitorId);
        Page<PostResponse> responsePage = posts.map(post -> toPostResponse(post, currentUserId));

        return PostListResponse.from(responsePage);
    }

    /**
     * 내 게시글 목록 조회
     */
    public PostListResponse getMyPosts(String visitorId, Pageable pageable) {
        Member member = findMemberByUuid(visitorId);

        Page<Post> posts = postRepository.findMyPosts(member.getId(), pageable);
        Page<PostResponse> responsePage = posts.map(post -> toPostResponse(post, member.getId()));

        return PostListResponse.from(responsePage);
    }

    /**
     * 게시글 상세 조회
     */
    public PostResponse getPost(Long postId, String visitorId) {
        Post post = findPostById(postId);
        Long currentUserId = getCurrentUserId(visitorId);

        return toPostResponse(post, currentUserId);
    }

    /**
     * 게시글 작성
     */
    @Transactional
    public PostResponse createPost(PostCreateRequest request, String visitorId) {
        Member member = findMemberByUuid(visitorId);

        // 카테고리 존재 확인
        categoryRepository.findByIdAndDeletedAtIsNull(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다"));

        // Enum 유효성 검증
        validatePostTypeRequired(request.getPostType());
        if (request.getCurrencyType() != null) {
            validateCurrencyType(request.getCurrencyType());
        }

        Post post = Post.builder()
                .userId(member.getId())
                .postType(request.getPostType())
                .categoryId(request.getCategoryId())
                .itemName(request.getItemName())
                .currencyType(request.getCurrencyType())
                .price(request.getPrice())
                .priceNegotiable(request.getPriceNegotiable())
                .description(request.getDescription())
                .build();

        Post savedPost = postRepository.save(post);
        log.info("게시글 작성 완료 - postId: {}, userId: {}", savedPost.getId(), member.getId());

        return toPostResponse(savedPost, member.getId());
    }

    /**
     * 게시글 수정
     * - 본인만 수정 가능
     */
    @Transactional
    public PostResponse updatePost(Long postId, PostUpdateRequest request, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Post post = findPostById(postId);

        // 본인 확인
        validateOwnership(post, member.getId());

        // 카테고리 존재 확인
        categoryRepository.findByIdAndDeletedAtIsNull(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다"));

        // Enum 유효성 검증
        validatePostTypeRequired(request.getPostType());
        if (request.getCurrencyType() != null) {
            validateCurrencyType(request.getCurrencyType());
        }

        post.update(
                request.getPostType(),
                request.getCategoryId(),
                request.getItemName(),
                request.getCurrencyType(),
                request.getPrice(),
                request.getPriceNegotiable(),
                request.getDescription()
        );

        log.info("게시글 수정 완료 - postId: {}, userId: {}", postId, member.getId());
        return toPostResponse(post, member.getId());
    }

    /**
     * 게시글 삭제 (soft delete)
     * - 본인만 삭제 가능
     */
    @Transactional
    public void deletePost(Long postId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Post post = findPostById(postId);

        validateOwnership(post, member.getId());

        post.delete();
        log.info("게시글 삭제 완료 - postId: {}, userId: {}", postId, member.getId());
    }

    /**
     * 게시글 상태 변경
     * - 본인만 변경 가능
     * - AVAILABLE -> RESERVED -> COMPLETED
     */
    @Transactional
    public PostResponse updatePostStatus(Long postId, PostStatusUpdateRequest request, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Post post = findPostById(postId);

        validateOwnership(post, member.getId());

        // 상태 값 유효성 검증
        String validStatus = validateStatusRequired(request.getStatus());
        post.updateStatus(validStatus);

        log.info("게시글 상태 변경 완료 - postId: {}, status: {}", postId, validStatus);
        return toPostResponse(post, member.getId());
    }

    /**
     * 게시글 끌어올리기
     * - 본인만 가능
     * - 마지막 끌올/생성 후 72시간(3일) 이후에만 가능
     */
    @Transactional
    public PostResponse bumpPost(Long postId, String visitorId) {
        Member member = findMemberByUuid(visitorId);
        Post post = findPostById(postId);

        validateOwnership(post, member.getId());

        // 끌어올리기 제한 체크
        LocalDateTime lastBumpOrCreate = post.getBumpedAt() != null ? post.getBumpedAt() : post.getCreatedAt();
        LocalDateTime nextAvailable = lastBumpOrCreate.plusHours(BUMP_LIMIT_HOURS);

        if (LocalDateTime.now().isBefore(nextAvailable)) {
            throw new IllegalStateException(
                    String.format("끌어올리기는 %d시간에 한 번만 가능합니다. 다음 가능 시간: %s",
                            BUMP_LIMIT_HOURS, nextAvailable)
            );
        }

        post.bump();
        log.info("게시글 끌어올리기 완료 - postId: {}", postId);

        return toPostResponse(post, member.getId());
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
     * 현재 로그인한 사용자 ID 조회 (null 허용)
     */
    private Long getCurrentUserId(String visitorId) {
        if (visitorId == null) {
            return null;
        }
        return memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(visitorId))
                .map(Member::getId)
                .orElse(null);
    }

    /**
     * 게시글 소유자 확인
     */
    private void validateOwnership(Post post, Long userId) {
        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 게시글만 수정/삭제할 수 있습니다");
        }
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

        // 찜 여부 확인
        Boolean isLiked = currentUserId != null
                && postLikeRepository.existsByPostIdAndUserIdAndDeletedAtIsNull(post.getId(), currentUserId);

        return PostResponse.from(post, nickname, islandName, mannerScore, categoryName, isLiked);
    }

    /**
     * PostType 유효성 검증 (선택, null 허용)
     */
    private String validatePostType(String postType) {
        if (postType == null || postType.isBlank()) {
            return null;
        }
        try {
            return PostType.valueOf(postType.toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 게시글 유형입니다: " + postType);
        }
    }

    /**
     * PostType 유효성 검증 (필수)
     */
    private void validatePostTypeRequired(String postType) {
        try {
            PostType.valueOf(postType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 게시글 유형입니다: " + postType);
        }
    }

    /**
     * PostStatus 유효성 검증 (선택, null 허용)
     */
    private String validateStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return PostStatus.valueOf(status.toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 상태입니다: " + status);
        }
    }

    /**
     * PostStatus 유효성 검증 (필수)
     */
    private String validateStatusRequired(String status) {
        try {
            return PostStatus.valueOf(status.toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 상태입니다: " + status);
        }
    }

    /**
     * CurrencyType 유효성 검증
     */
    private void validateCurrencyType(String currencyType) {
        try {
            CurrencyType.valueOf(currencyType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 화폐 유형입니다: " + currencyType);
        }
    }
}
