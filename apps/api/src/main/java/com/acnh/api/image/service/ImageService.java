package com.acnh.api.image.service;

import com.acnh.api.member.entity.Member;
import com.acnh.api.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 이미지 업로드/삭제 서비스
 * Cloudflare R2에 이미지를 저장하고 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImageService {

    private final S3Client s3Client;
    private final MemberRepository memberRepository;

    @Value("${r2.bucket-name}")
    private String bucketName;

    @Value("${r2.public-url}")
    private String publicUrl;

    @Value("${image.allowed-types}")
    private String allowedTypes;

    @Value("${image.max-count.post}")
    private int maxPostImages;

    @Value("${image.max-count.chat}")
    private int maxChatImages;

    // 이미지 경로에서 사용자 ID 추출용 패턴: {folder}/{userId}/{timestamp}_{uuid}.{ext}
    private static final Pattern IMAGE_PATH_PATTERN = Pattern.compile("^(posts|chat|profiles)/(\\d+)/.*$");

    /**
     * 게시글용 이미지 업로드 (최대 10개)
     */
    public List<String> uploadPostImages(List<MultipartFile> files, String visitorId) {
        Long userId = findMemberByUuid(visitorId).getId();
        validateFileCount(files, maxPostImages, "게시글");
        return uploadImages(files, "posts", userId);
    }

    /**
     * 채팅용 이미지 업로드 (최대 10개)
     */
    public List<String> uploadChatImages(List<MultipartFile> files, String visitorId) {
        Long userId = findMemberByUuid(visitorId).getId();
        validateFileCount(files, maxChatImages, "채팅");
        return uploadImages(files, "chat", userId);
    }

    /**
     * 프로필 이미지 업로드 (단일)
     */
    public String uploadProfileImage(MultipartFile file, String visitorId) {
        Long userId = findMemberByUuid(visitorId).getId();
        validateFile(file);
        return uploadImage(file, "profiles", userId);
    }

    /**
     * 이미지 삭제 (소유권 검증 포함)
     * @param imageUrl 삭제할 이미지의 전체 URL
     * @param visitorId 요청한 사용자 UUID
     */
    public void deleteImage(String imageUrl, String visitorId) {
        Long userId = findMemberByUuid(visitorId).getId();

        // URL에서 키 추출 (publicUrl 이후 부분)
        String key = imageUrl.replace(publicUrl + "/", "");

        // 소유권 검증
        validateImageOwnership(key, userId);

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("이미지 삭제 완료: userId={}, key={}", userId, key);
        } catch (Exception e) {
            log.error("이미지 삭제 실패: {}", imageUrl, e);
            throw new RuntimeException("이미지 삭제에 실패했습니다.");
        }
    }

    /**
     * 이미지 소유권 검증
     * 경로 형식: {folder}/{userId}/{timestamp}_{uuid}.{ext}
     */
    private void validateImageOwnership(String key, Long userId) {
        Matcher matcher = IMAGE_PATH_PATTERN.matcher(key);
        if (!matcher.matches()) {
            log.warn("잘못된 이미지 경로 형식: {}", key);
            throw new IllegalArgumentException("잘못된 이미지 경로입니다.");
        }

        Long imageOwnerId = Long.parseLong(matcher.group(2));
        if (!imageOwnerId.equals(userId)) {
            log.warn("이미지 삭제 권한 없음: userId={}, imageOwnerId={}, key={}", userId, imageOwnerId, key);
            throw new AccessDeniedException("해당 이미지를 삭제할 권한이 없습니다.");
        }
    }

    /**
     * 여러 이미지 업로드 공통 로직
     */
    private List<String> uploadImages(List<MultipartFile> files, String folder, Long userId) {
        List<String> uploadedUrls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = uploadImage(file, folder, userId);
                uploadedUrls.add(url);
            }
        }

        return uploadedUrls;
    }

    /**
     * 단일 이미지 업로드
     * 경로 형식: {folder}/{userId}/{timestamp}_{uuid}.{ext}
     */
    private String uploadImage(MultipartFile file, String folder, Long userId) {
        validateFile(file);

        try {
            // UUID + 타임스탬프로 고유한 파일명 생성 (사용자 ID 포함)
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String key = String.format("%s/%d/%d_%s%s",
                    folder,
                    userId,
                    System.currentTimeMillis(),
                    UUID.randomUUID().toString().substring(0, 8),
                    extension);

            // Content-Type 설정하여 브라우저에서 이미지로 인식
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromBytes(file.getBytes()));

            String imageUrl = publicUrl + "/" + key;
            log.info("이미지 업로드 완료: {}", imageUrl);

            return imageUrl;
        } catch (IOException e) {
            log.error("이미지 업로드 실패: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("이미지 업로드에 실패했습니다.");
        }
    }

    /**
     * 파일 개수 검증
     */
    private void validateFileCount(List<MultipartFile> files, int maxCount, String type) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("업로드할 이미지가 없습니다.");
        }
        if (files.size() > maxCount) {
            throw new IllegalArgumentException(
                    String.format("%s 이미지는 최대 %d개까지 업로드할 수 있습니다.", type, maxCount));
        }
    }

    /**
     * 파일 유효성 검증
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }

        String contentType = file.getContentType();
        List<String> allowed = Arrays.asList(allowedTypes.split(","));

        if (contentType == null || !allowed.contains(contentType)) {
            throw new IllegalArgumentException(
                    "지원하지 않는 파일 형식입니다. (허용: JPEG, PNG, GIF, WebP)");
        }
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * UUID로 회원 조회
     */
    private Member findMemberByUuid(String visitorId) {
        if (visitorId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다");
        }
        return memberRepository.findByUuidAndDeletedAtIsNull(UUID.fromString(visitorId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }
}
