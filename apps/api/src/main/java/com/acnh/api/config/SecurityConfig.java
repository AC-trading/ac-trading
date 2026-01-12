package com.acnh.api.config;

import com.acnh.api.auth.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
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
                    "/api/auth/**",     // 인증 관련 API
                    "/health",          // 헬스체크
                    "/",                // 루트
                    "/error"            // 에러 페이지
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

        // 허용할 Origin
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",           // 로컬 프론트엔드
            "https://ac-trading.vercel.app"    // 프로덕션 프론트엔드
        ));

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
