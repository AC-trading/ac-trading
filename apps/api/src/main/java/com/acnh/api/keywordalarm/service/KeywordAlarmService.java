package com.acnh.api.keywordalarm.service;

import com.acnh.api.keywordalarm.dto.KeywordAlarmCreateRequest;
import com.acnh.api.keywordalarm.dto.KeywordAlarmListResponse;
import com.acnh.api.keywordalarm.dto.KeywordAlarmResponse;
import com.acnh.api.keywordalarm.entity.KeywordAlarm;
import com.acnh.api.keywordalarm.repository.KeywordAlarmRepository;
import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 키워드 알림 비즈니스 로직 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KeywordAlarmService {

    private final KeywordAlarmRepository keywordAlarmRepository;
    private final MemberRepository memberRepository;

    // 최대 키워드 등록 개수 제한
    private static final int MAX_KEYWORDS = 30;

    /**
     * 내 키워드 목록 조회
     */
    public KeywordAlarmListResponse getMyKeywords(String visitorId) {
        Member member = findMemberByUuid(visitorId);

        List<KeywordAlarmResponse> keywords = keywordAlarmRepository
                .findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(member.getId())
                .stream()
                .map(KeywordAlarmResponse::from)
                .collect(Collectors.toList());

        return KeywordAlarmListResponse.of(keywords);
    }

    /**
     * 키워드 추가
     * - 삭제된 동일 키워드가 있으면 복구 (CodeRabbit 리뷰 반영: soft delete와 unique 제약 조건 충돌 해결)
     */
    @Transactional
    public KeywordAlarmResponse createKeyword(String visitorId, KeywordAlarmCreateRequest request) {
        Member member = findMemberByUuid(visitorId);

        String keyword = request.getKeyword().trim();

        // 키워드 개수 제한 체크
        long currentCount = keywordAlarmRepository.countByUserIdAndDeletedAtIsNull(member.getId());
        if (currentCount >= MAX_KEYWORDS) {
            throw new IllegalStateException("키워드는 최대 " + MAX_KEYWORDS + "개까지 등록할 수 있습니다");
        }

        // 중복 키워드 체크 (대소문자 구분 없이)
        if (keywordAlarmRepository.existsByUserIdAndKeywordIgnoreCaseAndDeletedAtIsNull(member.getId(), keyword)) {
            throw new IllegalStateException("이미 등록된 키워드입니다");
        }

        // 삭제된 동일 키워드가 있으면 복구 (soft delete + unique 제약 조건 충돌 해결)
        // CodeRabbit 리뷰 반영: 동시 요청 시 DB 제약 예외를 사용자 오류로 변환
        try {
            KeywordAlarm keywordAlarm = keywordAlarmRepository
                    .findDeletedByUserIdAndKeywordIgnoreCase(member.getId(), keyword)
                    .map(existing -> {
                        existing.restore();
                        log.info("키워드 복구 완료 - userId: {}, keywordId: {}", member.getId(), existing.getId());
                        return existing;
                    })
                    .orElseGet(() -> {
                        KeywordAlarm newKeyword = KeywordAlarm.builder()
                                .userId(member.getId())
                                .keyword(keyword)
                                .build();
                        keywordAlarmRepository.save(newKeyword);
                        log.info("키워드 등록 완료 - userId: {}, keywordId: {}", member.getId(), newKeyword.getId());
                        return newKeyword;
                    });

            return KeywordAlarmResponse.from(keywordAlarm);
        } catch (DataIntegrityViolationException e) {
            // 동시 요청으로 인한 중복 또는 제한 초과
            log.warn("키워드 등록 실패 (동시 요청) - userId: {}", member.getId());
            throw new IllegalStateException("이미 등록된 키워드이거나 등록 한도를 초과했습니다");
        }
    }

    /**
     * 키워드 삭제
     */
    @Transactional
    public void deleteKeyword(String visitorId, Long keywordId) {
        Member member = findMemberByUuid(visitorId);

        KeywordAlarm keywordAlarm = keywordAlarmRepository
                .findByIdAndUserIdAndDeletedAtIsNull(keywordId, member.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 키워드입니다"));

        keywordAlarm.delete();

        log.info("키워드 삭제 완료 - userId: {}, keywordId: {}", member.getId(), keywordId);
    }

    /**
     * 아이템명과 매칭되는 키워드를 가진 사용자 ID 목록 조회
     * - 게시글 생성 시 알림 발송에 사용
     */
    public List<Long> findUserIdsByMatchingKeyword(String itemName, Long authorId) {
        return keywordAlarmRepository.findUserIdsByMatchingKeyword(itemName, authorId);
    }

    // ========== Private Helper Methods ==========

    /**
     * UUID로 회원 조회
     * - CodeRabbit 리뷰 반영: UUID 파싱 예외 처리 추가
     */
    private Member findMemberByUuid(String visitorId) {
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            throw new IllegalArgumentException("로그인이 필요합니다");
        }
        UUID uuid;
        try {
            uuid = UUID.fromString(visitorId);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 인증 정보입니다");
        }
        return memberRepository.findByUuidAndDeletedAtIsNull(uuid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }
}
