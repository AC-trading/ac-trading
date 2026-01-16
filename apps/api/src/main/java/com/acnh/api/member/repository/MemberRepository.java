package com.acnh.api.member.repository;

import com.acnh.api.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 사용자 Repository
 */
public interface MemberRepository extends JpaRepository<Member, Long> {

    /**
     * ID로 삭제되지 않은 회원 조회
     */
    Optional<Member> findByIdAndDeletedAtIsNull(Long id);

    /**
     * UUID로 삭제되지 않은 회원 조회
     */
    Optional<Member> findByUuidAndDeletedAtIsNull(UUID uuid);

    /**
     * Cognito Sub으로 삭제되지 않은 회원 조회
     */
    Optional<Member> findByCognitoSubAndDeletedAtIsNull(String cognitoSub);

    /**
     * 이메일로 삭제되지 않은 회원 조회
     */
    Optional<Member> findByEmailAndDeletedAtIsNull(String email);

    /**
     * 닉네임으로 삭제되지 않은 회원 조회
     */
    Optional<Member> findByNicknameAndDeletedAtIsNull(String nickname);

    /**
     * Cognito Sub 존재 여부 확인
     */
    boolean existsByCognitoSubAndDeletedAtIsNull(String cognitoSub);

    /**
     * 이메일 존재 여부 확인
     */
    boolean existsByEmailAndDeletedAtIsNull(String email);

    /**
     * 닉네임 존재 여부 확인
     */
    boolean existsByNicknameAndDeletedAtIsNull(String nickname);
}
