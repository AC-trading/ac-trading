package com.acnh.api.report.repository;

import com.acnh.api.report.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 신고 Repository
 */
public interface ReportRepository extends JpaRepository<Report, Long> {

    /**
     * ID로 삭제되지 않은 신고 조회
     */
    Optional<Report> findByIdAndDeletedAtIsNull(Long id);

    /**
     * 신고자 ID로 삭제되지 않은 신고 페이징 조회
     */
    Page<Report> findByReporterIdAndDeletedAtIsNull(Long reporterId, Pageable pageable);

    /**
     * 게시글 ID로 삭제되지 않은 신고 페이징 조회
     */
    Page<Report> findByPostIdAndDeletedAtIsNull(Long postId, Pageable pageable);

    /**
     * 상태로 삭제되지 않은 신고 페이징 조회
     */
    Page<Report> findByStatusAndDeletedAtIsNull(String status, Pageable pageable);

    /**
     * 삭제되지 않은 모든 신고 페이징 조회
     */
    Page<Report> findByDeletedAtIsNull(Pageable pageable);

    /**
     * 게시글에 대한 신고 수 조회
     */
    long countByPostIdAndDeletedAtIsNull(Long postId);
}
