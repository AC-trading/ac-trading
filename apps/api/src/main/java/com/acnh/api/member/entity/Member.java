package com.acnh.api.member.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 사용자 Entity
 * - users 테이블 매핑
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uuid", nullable = false, updatable = false)
    private UUID uuid;

    @Column(name = "cognito_sub", nullable = false)
    private String cognitoSub;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    @Column(name = "nickname", nullable = false, length = 50)
    private String nickname;

    @Column(name = "island_name", nullable = false, length = 50)
    private String islandName;

    @Column(name = "dream_address", length = 20)
    private String dreamAddress;

    @Column(name = "hemisphere", nullable = false, length = 10)
    private String hemisphere;

    @Column(name = "manner_score", nullable = false)
    private Integer mannerScore;

    @Column(name = "total_trade_count", nullable = false)
    private Integer totalTradeCount;

    @Builder
    public Member(UUID uuid, String cognitoSub, String email, String provider,
                  String providerId, String nickname, String islandName,
                  String dreamAddress, String hemisphere, Integer mannerScore,
                  Integer totalTradeCount) {
        this.uuid = uuid != null ? uuid : UUID.randomUUID();
        this.cognitoSub = cognitoSub;
        this.email = email;
        this.provider = provider;
        this.providerId = providerId;
        this.nickname = nickname;
        this.islandName = islandName;
        this.dreamAddress = dreamAddress;
        this.hemisphere = hemisphere != null ? hemisphere : "NORTH";
        this.mannerScore = mannerScore != null ? mannerScore : 100;
        this.totalTradeCount = totalTradeCount != null ? totalTradeCount : 0;
    }

    /**
     * 프로필 정보 업데이트
     */
    public void updateProfile(String nickname, String islandName, String dreamAddress, String hemisphere) {
        this.nickname = nickname;
        this.islandName = islandName;
        this.dreamAddress = dreamAddress;
        this.hemisphere = hemisphere;
    }

    /**
     * 매너 점수 증가
     */
    public void increaseMannerScore(int amount) {
        this.mannerScore += amount;
    }

    /**
     * 매너 점수 감소
     */
    public void decreaseMannerScore(int amount) {
        this.mannerScore = Math.max(0, this.mannerScore - amount);
    }

    /**
     * 거래 횟수 증가
     */
    public void incrementTradeCount() {
        this.totalTradeCount++;
    }
}
