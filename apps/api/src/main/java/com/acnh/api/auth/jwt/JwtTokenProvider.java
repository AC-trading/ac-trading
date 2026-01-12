package com.acnh.api.auth.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 토큰 생성 및 검증 유틸리티
 * - Access Token: 1시간 유효
 * - Refresh Token: 30일 유효
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKeyString;

    @Value("${jwt.access-token-validity:3600000}") // 1시간 (밀리초)
    private long accessTokenValidity;

    @Value("${jwt.refresh-token-validity:2592000000}") // 30일 (밀리초)
    private long refreshTokenValidity;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        // 최소 256비트(32바이트) 키 필요
        this.secretKey = Keys.hmacShaKeyFor(secretKeyString.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Access Token 생성
     */
    public String createAccessToken(String userId, String email) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + accessTokenValidity);

        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("type", "access")
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Refresh Token 생성
     */
    public String createRefreshToken(String userId) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + refreshTokenValidity);

        return Jwts.builder()
                .subject(userId)
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey)
                .compact();
    }

    /**
     * 토큰에서 사용자 ID 추출
     */
    public String getUserId(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * 토큰에서 이메일 추출
     */
    public String getEmail(String token) {
        return parseClaims(token).get("email", String.class);
    }

    /**
     * 토큰 유효성 검증
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("만료된 JWT 토큰입니다.");
        } catch (UnsupportedJwtException e) {
            log.warn("지원되지 않는 JWT 토큰입니다.");
        } catch (MalformedJwtException e) {
            log.warn("잘못된 형식의 JWT 토큰입니다.");
        } catch (SecurityException e) {
            log.warn("JWT 서명이 유효하지 않습니다.");
        } catch (IllegalArgumentException e) {
            log.warn("JWT 토큰이 비어있습니다.");
        }
        return false;
    }

    /**
     * Access Token인지 확인
     */
    public boolean isAccessToken(String token) {
        try {
            String type = parseClaims(token).get("type", String.class);
            return "access".equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Refresh Token인지 확인
     */
    public boolean isRefreshToken(String token) {
        try {
            String type = parseClaims(token).get("type", String.class);
            return "refresh".equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 토큰 만료 시간 반환 (밀리초)
     */
    public long getAccessTokenValidity() {
        return accessTokenValidity;
    }

    public long getRefreshTokenValidity() {
        return refreshTokenValidity;
    }

    /**
     * 토큰 파싱하여 Claims 반환
     */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
