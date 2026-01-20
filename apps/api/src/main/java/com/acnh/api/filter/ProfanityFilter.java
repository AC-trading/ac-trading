package com.acnh.api.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 금칙어 필터링 서비스
 * - 채팅 메시지, 게시글 등에서 금칙어 검사
 * - 앱스토어 정책 대응 (욕설/비방 필터링)
 */
@Slf4j
@Component
public class ProfanityFilter {

    // 금칙어 목록 (실제 서비스에서는 DB나 외부 설정에서 관리)
    private static final Set<String> PROFANITY_WORDS = new HashSet<>(Arrays.asList(
            // 욕설/비방
            "시발", "씨발", "ㅅㅂ", "ㅆㅂ", "병신", "ㅂㅅ", "지랄", "ㅈㄹ",
            "개새끼", "개세끼", "새끼", "ㅅㄲ", "미친", "ㅁㅊ", "존나", "ㅈㄴ",
            "꺼져", "닥쳐", "죽어", "뒤져",
            // 실거래 유도
            "현금", "현거래", "입금", "계좌", "송금", "페이팔", "paypal",
            // 외부 메신저 유도
            "카톡", "카카오톡", "라인", "디코", "디스코드", "텔레그램",
            // 사기 관련
            "선입금", "먼저입금", "선결제"
    ));

    // 우회 표현 패턴 (자음만, 초성 등)
    private static final Pattern BYPASS_PATTERN = Pattern.compile(
            "(시[ㅡ\\-_.*]+발)|(씨[ㅡ\\-_.*]+발)|(ㅅ[ㅡ\\-_.*]+ㅂ)|" +
            "(병[ㅡ\\-_.*]+신)|(ㅂ[ㅡ\\-_.*]+ㅅ)|" +
            "(새[ㅡ\\-_.*]+끼)|(ㅅ[ㅡ\\-_.*]+ㄲ)",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * 금칙어 포함 여부 검사
     * @param text 검사할 텍스트
     * @return 금칙어 포함 시 true
     */
    public boolean containsProfanity(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }

        String normalizedText = normalizeText(text);

        // 금칙어 목록 검사
        for (String word : PROFANITY_WORDS) {
            if (normalizedText.contains(word.toLowerCase())) {
                log.warn("금칙어 감지: {} (원문: {})", word, text);
                return true;
            }
        }

        // 우회 표현 패턴 검사
        Matcher matcher = BYPASS_PATTERN.matcher(normalizedText);
        if (matcher.find()) {
            log.warn("우회 금칙어 감지: {} (원문: {})", matcher.group(), text);
            return true;
        }

        return false;
    }

    /**
     * 금칙어 마스킹 처리
     * @param text 원본 텍스트
     * @return 금칙어가 ***로 대체된 텍스트
     */
    public String maskProfanity(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }

        String result = text;

        // 금칙어 목록 마스킹
        for (String word : PROFANITY_WORDS) {
            String replacement = "*".repeat(word.length());
            result = result.replaceAll("(?i)" + Pattern.quote(word), replacement);
        }

        // 우회 표현 마스킹
        Matcher matcher = BYPASS_PATTERN.matcher(result);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            matcher.appendReplacement(sb, "*".repeat(matcher.group().length()));
        }
        matcher.appendTail(sb);

        return sb.toString();
    }

    /**
     * 텍스트 정규화 (공백, 특수문자 제거 등)
     */
    private String normalizeText(String text) {
        return text.toLowerCase()
                .replaceAll("[\\s\\p{Punct}]", ""); // 공백, 구두점 제거
    }

    /**
     * 금칙어 검사 후 예외 발생
     * @param text 검사할 텍스트
     * @throws IllegalArgumentException 금칙어 포함 시
     */
    public void validateText(String text) {
        if (containsProfanity(text)) {
            throw new IllegalArgumentException("부적절한 표현이 포함되어 있습니다");
        }
    }
}
