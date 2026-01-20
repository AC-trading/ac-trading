package com.acnh.api.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * 프로덕션 환경에서 JWT 시크릿 키 유효성 검증
 * - JWT_SECRET 환경변수가 설정되지 않으면 애플리케이션 시작 실패
 * - 개발용 키 패턴이 감지되면 애플리케이션 시작 실패
 */
@Slf4j
@Component
@Profile("prod")
public class SecurityConfigValidator {

    // Before: @Value("${jwt.secret}") - Spring이 먼저 PlaceholderResolutionException 발생
    // After: 기본값 빈 문자열로 설정하여 @PostConstruct에서 커스텀 메시지로 검증
    @Value("${jwt.secret:}")
    private String jwtSecret;

    // 개발용 키로 의심되는 패턴들
    private static final String[] DEV_KEY_PATTERNS = {
            "dev-secret",
            "test-secret",
            "local-secret",
            "your-secret",
            "change-me",
            "placeholder"
    };

    @PostConstruct
    public void validateSecurityConfig() {
        log.info("프로덕션 보안 설정 검증 시작...");

        // JWT_SECRET 필수 검증
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET 환경변수가 설정되지 않았습니다. " +
                    "프로덕션 환경에서는 반드시 안전한 시크릿 키를 설정해야 합니다."
            );
        }

        // 최소 길이 검증 (256비트 = 32바이트)
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET이 너무 짧습니다. 최소 32자 이상이어야 합니다. " +
                    "현재 길이: " + jwtSecret.length()
            );
        }

        // 개발용 키 패턴 검증
        String lowerSecret = jwtSecret.toLowerCase();
        for (String pattern : DEV_KEY_PATTERNS) {
            if (lowerSecret.contains(pattern)) {
                throw new IllegalStateException(
                        "JWT_SECRET에 개발용 키 패턴('" + pattern + "')이 포함되어 있습니다. " +
                        "프로덕션 환경에서는 안전한 랜덤 키를 사용해야 합니다."
                );
            }
        }

        log.info("프로덕션 보안 설정 검증 완료");
    }
}
