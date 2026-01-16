package com.acnh.api.config;

import com.acnh.api.chat.handler.StompHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket + STOMP 설정
 * - /ws 엔드포인트로 WebSocket 연결
 * - /topic/* 구독, /app/* 메시지 전송
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompHandler stompHandler;

    /*
     * [PR Review 수정]
     * Before: setAllowedOriginPatterns("*") - 모든 Origin 허용 (보안 위험)
     * After: SecurityConfig와 동일한 명시적 Origin 목록만 허용
     * 이유: SecurityConfig와 CORS 정책 불일치 및 보안 위험 해결
     */
    private static final String[] ALLOWED_ORIGINS = {
            "http://localhost:3000",           // 로컬 프론트엔드
            "https://ac-trading.vercel.app"    // 프로덕션 프론트엔드
    };

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트가 구독할 prefix (서버 -> 클라이언트)
        registry.enableSimpleBroker("/topic", "/queue");

        // 클라이언트가 메시지 보낼 때 prefix (클라이언트 -> 서버)
        registry.setApplicationDestinationPrefixes("/app");

        // 특정 사용자에게 메시지 보낼 때 prefix
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 연결 엔드포인트 (SecurityConfig와 동일한 Origin만 허용)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(ALLOWED_ORIGINS)
                .withSockJS();  // SockJS fallback (Vercel 등 WebSocket 미지원 환경 대응)
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // STOMP 메시지 인터셉터 (JWT 인증)
        registration.interceptors(stompHandler);
    }
}
