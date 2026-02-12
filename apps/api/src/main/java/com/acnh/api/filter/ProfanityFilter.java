package com.acnh.api.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
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
        // Before: log.warn("금칙어 감지: {} (원문: {})", word, text); - PII 유출 위험
        // After: 원문 대신 해시 fingerprint 사용
        for (String word : PROFANITY_WORDS) {
            if (normalizedText.contains(word.toLowerCase())) {
                log.warn("금칙어 감지: {} (msgHash: {})", word, hashFingerprint(text));
                return true;
            }
        }

        // 우회 표현 패턴 검사
        // Before: log.warn("우회 금칙어 감지: {} (원문: {})", matcher.group(), text); - PII 유출 위험
        // After: 원문 대신 해시 fingerprint 사용
        Matcher matcher = BYPASS_PATTERN.matcher(normalizedText);
        if (matcher.find()) {
            log.warn("우회 금칙어 감지: {} (msgHash: {})", matcher.group(), hashFingerprint(text));
            return true;
        }

        return false;
    }

    /**
     * 금칙어 마스킹 처리
     * - containsProfanity와 동일한 정규화 전략 사용
     * - 정규화된 텍스트에서 매칭 후 원본 텍스트의 해당 위치 마스킹
     * @param text 원본 텍스트
     * @return 금칙어가 ***로 대체된 텍스트
     */
    // Before: 원본 텍스트에 직접 replaceAll → 공백/특수문자로 우회된 금칙어 놓침
    // After: 정규화 후 매칭, 원본 인덱스 매핑하여 마스킹
    public String maskProfanity(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }

        // 원본 → 정규화 인덱스 매핑 생성
        int[] originalToNormalized = new int[text.length()];
        int[] normalizedToOriginalStart = new int[text.length()];
        int[] normalizedToOriginalEnd = new int[text.length()];

        StringBuilder normalizedBuilder = new StringBuilder();
        String lowerText = text.toLowerCase();

        for (int i = 0; i < text.length(); i++) {
            char c = lowerText.charAt(i);
            // normalizeText와 동일한 로직: 공백, 구두점 제거
            if (!Character.isWhitespace(c) && !isPunctuation(c)) {
                int normalizedIdx = normalizedBuilder.length();
                normalizedToOriginalStart[normalizedIdx] = i;
                normalizedToOriginalEnd[normalizedIdx] = i;
                originalToNormalized[i] = normalizedIdx;
                normalizedBuilder.append(c);
            } else {
                originalToNormalized[i] = normalizedBuilder.length(); // 다음 정규화 인덱스
            }
        }

        String normalizedText = normalizedBuilder.toString();
        char[] resultChars = text.toCharArray();

        // 금칙어 목록 마스킹
        for (String word : PROFANITY_WORDS) {
            String lowerWord = word.toLowerCase();
            int idx = 0;
            while ((idx = normalizedText.indexOf(lowerWord, idx)) != -1) {
                // 정규화 인덱스 → 원본 인덱스로 변환하여 마스킹
                int origStart = normalizedToOriginalStart[idx];
                int origEnd = normalizedToOriginalEnd[idx + lowerWord.length() - 1];
                for (int i = origStart; i <= origEnd; i++) {
                    if (!Character.isWhitespace(text.charAt(i))) {
                        resultChars[i] = '*';
                    }
                }
                idx += lowerWord.length();
            }
        }

        // 우회 표현 패턴 마스킹
        Matcher matcher = BYPASS_PATTERN.matcher(normalizedText);
        while (matcher.find()) {
            int origStart = normalizedToOriginalStart[matcher.start()];
            int origEnd = normalizedToOriginalEnd[matcher.end() - 1];
            for (int i = origStart; i <= origEnd; i++) {
                if (!Character.isWhitespace(text.charAt(i))) {
                    resultChars[i] = '*';
                }
            }
        }

        return new String(resultChars);
    }

    /**
     * 구두점 여부 확인 (normalizeText와 동일한 기준)
     */
    private boolean isPunctuation(char c) {
        return Character.getType(c) == Character.CONNECTOR_PUNCTUATION
                || Character.getType(c) == Character.DASH_PUNCTUATION
                || Character.getType(c) == Character.START_PUNCTUATION
                || Character.getType(c) == Character.END_PUNCTUATION
                || Character.getType(c) == Character.INITIAL_QUOTE_PUNCTUATION
                || Character.getType(c) == Character.FINAL_QUOTE_PUNCTUATION
                || Character.getType(c) == Character.OTHER_PUNCTUATION;
    }

    /**
     * 텍스트 정규화 (공백, 특수문자 제거 등)
     */
    private String normalizeText(String text) {
        return text.toLowerCase()
                .replaceAll("[\\s\\p{Punct}]", ""); // 공백, 구두점 제거
    }

    /**
     * 메시지 해시 fingerprint 생성 (PII 보호용)
     * - 로그 상관관계 추적을 위한 비민감 식별자
     * @param text 원본 텍스트
     * @return SHA-256 해시의 앞 8자리
     */
    private String hashFingerprint(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (int i = 0; i < 4; i++) { // 앞 4바이트 = 8자리 hex
                String hex = Integer.toHexString(0xff & hash[i]);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return "unknown";
        }
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
