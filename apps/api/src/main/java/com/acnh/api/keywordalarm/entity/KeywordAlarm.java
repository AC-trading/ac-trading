package com.acnh.api.keywordalarm.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * 키워드 알림 엔티티
 * - 사용자가 등록한 관심 키워드 저장
 * - 해당 키워드가 포함된 새 거래글 등록 시 알림 발송
 */
@Entity
@Table(name = "keyword_alarms",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_keyword_alarms_user_keyword",
        columnNames = {"user_id", "keyword"}
    )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class KeywordAlarm extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "keyword", nullable = false, length = 50)
    private String keyword;
}
