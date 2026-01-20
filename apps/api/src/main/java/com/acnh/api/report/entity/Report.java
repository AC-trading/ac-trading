package com.acnh.api.report.entity;

import com.acnh.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 신고 Entity
 * - reports 테이블 매핑
 */
@Entity
@Table(name = "reports")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    // 피신고자 ID (게시글 작성자)
    @Column(name = "reported_user_id", nullable = false)
    private Long reportedUserId;

    @Column(name = "reason_code", nullable = false, length = 50)
    private String reasonCode;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Builder
    public Report(Long reporterId, Long postId, Long reportedUserId, String reasonCode,
                  String description, String status) {
        this.reporterId = reporterId;
        this.postId = postId;
        this.reportedUserId = reportedUserId;
        this.reasonCode = reasonCode;
        this.description = description;
        this.status = status != null ? status : "PENDING";
    }

    /**
     * 상태 변경
     */
    public void updateStatus(String status) {
        this.status = status;
    }
}
