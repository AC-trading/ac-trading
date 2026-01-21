package com.acnh.api.block.service;

import com.acnh.api.block.dto.BlockListResponse;
import com.acnh.api.block.dto.BlockRequest;
import com.acnh.api.block.dto.BlockResponse;
import com.acnh.api.block.entity.Block;
import com.acnh.api.block.repository.BlockRepository;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 차단 관련 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BlockService {

    private final BlockRepository blockRepository;
    private final MemberRepository memberRepository;

    /**
     * 사용자 차단
     */
    @Transactional
    public BlockResponse blockUser(BlockRequest request, String visitorId) {
        Member blocker = findMemberByUuid(visitorId);
        Member blocked = findMemberById(request.getBlockedUserId());

        // 자기 자신 차단 불가
        if (blocker.getId().equals(blocked.getId())) {
            throw new IllegalArgumentException("자기 자신을 차단할 수 없습니다");
        }

        // 이미 차단된 사용자인지 확인
        if (blockRepository.existsByBlockerIdAndBlockedIdAndDeletedAtIsNull(blocker.getId(), blocked.getId())) {
            throw new IllegalArgumentException("이미 차단한 사용자입니다");
        }

        Block block = Block.builder()
                .blockerId(blocker.getId())
                .blockedId(blocked.getId())
                .reason(request.getReason())
                .build();

        Block savedBlock = blockRepository.save(block);
        log.info("사용자 차단 - blockerId: {}, blockedId: {}", blocker.getId(), blocked.getId());

        return BlockResponse.from(savedBlock, blocked.getNickname());
    }

    /**
     * 사용자 ID로 직접 차단 (신고 후 차단용)
     */
    @Transactional
    public BlockResponse blockUserById(Long blockedUserId, String reason, String visitorId) {
        Member blocker = findMemberByUuid(visitorId);
        Member blocked = findMemberById(blockedUserId);

        // 자기 자신 차단 불가
        if (blocker.getId().equals(blocked.getId())) {
            throw new IllegalArgumentException("자기 자신을 차단할 수 없습니다");
        }

        // 이미 차단된 사용자인지 확인 - 이미 차단된 경우 그냥 반환
        var existingBlock = blockRepository.findByBlockerIdAndBlockedIdAndDeletedAtIsNull(blocker.getId(), blocked.getId());
        if (existingBlock.isPresent()) {
            return BlockResponse.from(existingBlock.get(), blocked.getNickname());
        }

        Block block = Block.builder()
                .blockerId(blocker.getId())
                .blockedId(blocked.getId())
                .reason(reason)
                .build();

        Block savedBlock = blockRepository.save(block);
        log.info("신고 후 차단 - blockerId: {}, blockedId: {}", blocker.getId(), blocked.getId());

        return BlockResponse.from(savedBlock, blocked.getNickname());
    }

    /**
     * 차단 해제
     */
    @Transactional
    public void unblockUser(Long blockedUserId, String visitorId) {
        Member blocker = findMemberByUuid(visitorId);

        Block block = blockRepository.findByBlockerIdAndBlockedIdAndDeletedAtIsNull(blocker.getId(), blockedUserId)
                .orElseThrow(() -> new IllegalArgumentException("차단 내역이 존재하지 않습니다"));

        block.delete();
        log.info("차단 해제 - blockerId: {}, blockedId: {}", blocker.getId(), blockedUserId);
    }

    /**
     * 내가 차단한 사용자 목록 조회
     */
    public BlockListResponse getBlockedUsers(String visitorId) {
        Member member = findMemberByUuid(visitorId);

        List<Block> blocks = blockRepository.findByBlockerIdAndDeletedAtIsNullOrderByCreatedAtDesc(member.getId());

        if (blocks.isEmpty()) {
            return BlockListResponse.from(List.of());
        }

        // 차단된 사용자 정보 일괄 조회
        List<Long> blockedIds = blocks.stream().map(Block::getBlockedId).toList();
        Map<Long, Member> memberMap = memberRepository.findByIdInAndDeletedAtIsNull(blockedIds)
                .stream()
                .collect(Collectors.toMap(Member::getId, Function.identity()));

        List<BlockResponse> responses = blocks.stream()
                .map(block -> {
                    Member blocked = memberMap.get(block.getBlockedId());
                    String nickname = blocked != null ? blocked.getNickname() : "탈퇴한 사용자";
                    return BlockResponse.from(block, nickname);
                })
                .toList();

        return BlockListResponse.from(responses);
    }

    /**
     * 특정 사용자가 차단되었는지 확인
     */
    public boolean isBlocked(Long blockerId, Long blockedId) {
        return blockRepository.existsByBlockerIdAndBlockedIdAndDeletedAtIsNull(blockerId, blockedId);
    }

    /**
     * 내가 차단한 사용자 ID 목록 조회 (필터링용)
     */
    public Set<Long> getBlockedUserIds(Long userId) {
        return blockRepository.findByBlockerIdAndDeletedAtIsNull(userId)
                .stream()
                .map(Block::getBlockedId)
                .collect(Collectors.toSet());
    }

    // ========== Private Helper Methods ==========

    /**
     * Before: visitorId == null 만 체크하여 "anonymousUser"가 UUID 파싱 시도됨
     * After: "anonymousUser" 문자열도 비인증 상태로 처리
     */
    private Member findMemberByUuid(String visitorId) {
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            throw new IllegalArgumentException("로그인이 필요합니다");
        }
        return memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(visitorId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }

    private Member findMemberById(Long memberId) {
        return memberRepository.findByIdAndDeletedAtIsNull(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }
}
