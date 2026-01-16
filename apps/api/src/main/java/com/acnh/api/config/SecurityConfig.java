package com.acnh.api.config;

import com.acnh.api.auth.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 설정
 * - JWT 기반 Stateless 인증
 * - CORS 설정
 * - CSRF 비활성화 (JWT 사용)
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /*
     * [PR Review 수정]
     * Before: 하드코딩된 Origin 목록 사용
     * After: 환경 변수(app.cors.allowed-origins)에서 읽어서 WebSocketConfig와 공유
     * 이유: 환경별 설정 유연성 및 중복 제거
     */
    @Value("${app.cors.allowed-origins}")
    private String allowedOriginsString;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF 비활성화 (JWT 사용하므로 불필요)
            .csrf(AbstractHttpConfigurer::disable)

            // CORS 설정
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 세션 사용 안함 (Stateless)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // 요청별 권한 설정
            .authorizeHttpRequests(auth -> auth
                // 인증 없이 접근 가능한 경로
                .requestMatchers(
                    "/api/auth/**",       // 인증 관련 API
                    "/api/categories",    // 카테고리 목록 조회
                    "/api/posts",         // 게시글 목록 조회 (피드)
                    "/api/posts/search",  // 게시글 검색
                    "/ws/**",             // WebSocket 연결 (STOMP 인증은 별도 처리)
                    "/health",            // 헬스체크
                    "/",                  // 루트
                    "/error"              // 에러 페이지
                ).permitAll()

                // 그 외 모든 요청은 인증 필요
                .anyRequest().authenticated()
            )

            // JWT 필터 추가
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 허용할 Origin (환경 변수에서 읽음)
        configuration.setAllowedOrigins(Arrays.asList(allowedOriginsString.split(",")));

        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

        // 허용할 헤더
        configuration.setAllowedHeaders(List.of("*"));

        // 자격 증명 허용 (쿠키 전송 허용)
        configuration.setAllowCredentials(true);

        // 노출할 헤더 (프론트에서 접근 가능)
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Set-Cookie"
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
