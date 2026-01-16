package com.acnh.api.chat.handler;

import com.acnh.api.auth.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;

/**
 * STOMP 메시지 인터셉터
 * - CONNECT 시 JWT 토큰 검증
 * - 인증된 사용자 정보를 accessor.setUser()로 설정
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StompHandler implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        // CONNECT 명령일 때만 인증 처리
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);

            if (token != null && jwtTokenProvider.validateToken(token)) {
                String userId = jwtTokenProvider.getUserId(token);

                /*
                 * [PR Review 수정]
                 * Before: SecurityContextHolder.getContext().setAuthentication() + accessor.setUser()
                 * After: accessor.setUser()만 사용
                 * 이유: ThreadLocal 기반 SecurityContextHolder는 STOMP 세션과 무관하여 불필요
                 */
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());

                accessor.setUser(authentication);

                log.info("WebSocket 연결 인증 성공 - userId: {}", userId);
            } else {
                log.warn("WebSocket 연결 인증 실패 - 유효하지 않은 토큰");
                // 인증 실패 시에도 연결은 허용 (구독 시 체크)
            }
        }

        return message;
    }

    /**
     * Authorization 헤더에서 토큰 추출
     * - "Bearer {token}" 형식
     */
    private String extractToken(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // 쿼리 파라미터에서도 토큰 추출 시도 (SockJS fallback용)
        String tokenParam = accessor.getFirstNativeHeader("token");
        if (tokenParam != null) {
            return tokenParam;
        }

        return null;
    }
}
