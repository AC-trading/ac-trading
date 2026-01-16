package com.acnh.api.config;

import com.acnh.api.chat.handler.StompHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
     * Before: 하드코딩된 ALLOWED_ORIGINS 상수 사용
     * After: 환경 변수(app.cors.allowed-origins)에서 읽어서 SecurityConfig와 공유
     * 이유: 환경별 설정 유연성 및 중복 제거
     */
    @Value("${app.cors.allowed-origins}")
    private String allowedOriginsString;

    /**
     * 환경 변수에서 읽은 Origin 문자열을 배열로 변환
     */
    private String[] getAllowedOrigins() {
        return allowedOriginsString.split(",");
    }

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
        // WebSocket 연결 엔드포인트 (환경 변수에서 읽은 Origin만 허용)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(getAllowedOrigins())
                .withSockJS();  // SockJS fallback (Vercel 등 WebSocket 미지원 환경 대응)
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // STOMP 메시지 인터셉터 (JWT 인증)
        registration.interceptors(stompHandler);
    }
}
