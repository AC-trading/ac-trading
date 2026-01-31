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

        KeywordAlarm keywordAlarm = KeywordAlarm.builder()
                .userId(member.getId())
                .keyword(keyword)
                .build();

        keywordAlarmRepository.save(keywordAlarm);

        log.info("키워드 등록 완료 - userId: {}, keyword: {}", member.getId(), keyword);

        return KeywordAlarmResponse.from(keywordAlarm);
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
     */
    private Member findMemberByUuid(String visitorId) {
        if (visitorId == null || "anonymousUser".equals(visitorId)) {
            throw new IllegalArgumentException("로그인이 필요합니다");
        }
        return memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(visitorId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }
}
