package com.acnh.api.auth.controller;

import com.acnh.api.auth.dto.ErrorResponse;
import com.acnh.api.auth.dto.TokenResponse;
import com.acnh.api.auth.jwt.JwtTokenProvider;
import com.acnh.api.auth.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 인증 관련 API 컨트롤러
 * - /api/auth/refresh: Refresh Token으로 Access Token 갱신
 * - /api/auth/logout: 로그아웃 (쿠키 삭제)
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    /**
     * Access Token 갱신
     * - HttpOnly 쿠키에서 Refresh Token 읽기
     * - 새로운 Access Token 발급
     * - 새로운 Refresh Token도 함께 갱신 (Sliding Session)
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request,
                                          HttpServletResponse response) {

        // 쿠키에서 Refresh Token 추출
        String refreshToken = cookieUtil.getRefreshTokenFromCookie(request)
                .orElse(null);

        // Refresh Token이 없는 경우
        if (refreshToken == null) {
            log.warn("Refresh Token이 쿠키에 없습니다.");
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.of(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "Refresh Token이 없습니다."
                    ));
        }

        // Refresh Token 유효성 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            log.warn("유효하지 않은 Refresh Token입니다.");
            // 무효한 토큰이면 쿠키 삭제
            ResponseCookie deleteCookie = cookieUtil.deleteRefreshTokenCookie();
            cookieUtil.addCookie(response, deleteCookie);

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.of(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "유효하지 않은 Refresh Token입니다."
                    ));
        }

        // Refresh Token 타입 확인
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            log.warn("Refresh Token 타입이 아닙니다.");
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ErrorResponse.of(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "Refresh Token 타입이 아닙니다."
                    ));
        }

        // 사용자 정보 추출
        String userId = jwtTokenProvider.getUserId(refreshToken);

        // 새로운 Access Token 생성
        // TODO: DB에서 사용자 이메일 조회 (현재는 임시로 null)
        String newAccessToken = jwtTokenProvider.createAccessToken(userId, null);

        // 새로운 Refresh Token 생성 (Sliding Session)
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);

        // 새로운 Refresh Token을 HttpOnly 쿠키로 설정
        long maxAgeSeconds = jwtTokenProvider.getRefreshTokenValidity() / 1000;
        ResponseCookie newCookie = cookieUtil.createRefreshTokenCookie(newRefreshToken, maxAgeSeconds);
        cookieUtil.addCookie(response, newCookie);

        log.info("토큰 갱신 성공 - userId: {}", userId);

        // Access Token만 응답 바디로 반환
        return ResponseEntity.ok(TokenResponse.of(
                newAccessToken,
                jwtTokenProvider.getAccessTokenValidity()
        ));
    }

    /**
     * 로그아웃
     * - Refresh Token 쿠키 삭제
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {

        // Refresh Token 쿠키 삭제
        ResponseCookie deleteCookie = cookieUtil.deleteRefreshTokenCookie();
        cookieUtil.addCookie(response, deleteCookie);

        log.info("로그아웃 처리 완료");

        return ResponseEntity.ok().build();
    }

    /**
     * 헬스체크
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is healthy");
    }
}
