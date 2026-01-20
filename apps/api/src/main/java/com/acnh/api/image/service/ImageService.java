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
import java.util.List;
import java.util.Map;
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

    @Value("${image.max-count.post}")
    private int maxPostImages;

    @Value("${image.max-count.chat}")
    private int maxChatImages;

    // 이미지 경로에서 사용자 ID 추출용 패턴: {folder}/{userId}/{timestamp}_{uuid}.{ext}
    private static final Pattern IMAGE_PATH_PATTERN = Pattern.compile("^(posts|chat|profiles)/(\\d+)/.*$");

    // 파일 매직 바이트로 실제 MIME 타입 감지 (클라이언트 제공값 신뢰하지 않음)
    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "image/png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A},
            "image/gif", new byte[]{0x47, 0x49, 0x46, 0x38},  // GIF87a or GIF89a
            "image/webp", new byte[]{0x52, 0x49, 0x46, 0x46}   // RIFF (WebP는 추가 검증 필요)
    );

    // MIME 타입별 표준 확장자
    private static final Map<String, String> MIME_TO_EXTENSION = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/gif", ".gif",
            "image/webp", ".webp"
    );

    // 허용된 MIME 타입 목록
    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

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
     * 이미지 삭제 (URL 검증 및 소유권 검증 포함)
     * @param imageUrl 삭제할 이미지의 전체 URL
     * @param visitorId 요청한 사용자 UUID
     */
    public void deleteImage(String imageUrl, String visitorId) {
        Long userId = findMemberByUuid(visitorId).getId();

        // URL 유효성 검증: 반드시 우리 R2 publicUrl로 시작해야 함
        String urlPrefix = publicUrl + "/";
        if (imageUrl == null || !imageUrl.startsWith(urlPrefix)) {
            log.warn("잘못된 이미지 URL 요청: userId={}, imageUrl={}", userId, imageUrl);
            throw new IllegalArgumentException("유효하지 않은 이미지 URL입니다.");
        }

        // URL에서 키 추출 (publicUrl 이후 부분)
        String key = imageUrl.substring(urlPrefix.length());

        // 소유권 검증
        validateImageOwnership(key, userId);

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("이미지 삭제 완료: bucket={}, key={}, userId={}", bucketName, key, userId);
        } catch (Exception e) {
            log.error("이미지 삭제 실패: bucket={}, key={}, userId={}", bucketName, key, userId, e);
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
     * 파일 바이트에서 실제 MIME 타입을 감지하여 확장자 결정
     */
    private String uploadImage(MultipartFile file, String folder, Long userId) {
        // 기본 파일 검증 (null, empty)
        validateFile(file);

        try {
            byte[] fileBytes = file.getBytes();

            // 파일 바이트에서 실제 MIME 타입 감지 (클라이언트 제공값 신뢰하지 않음)
            String detectedMime = detectMimeType(fileBytes);
            if (detectedMime == null || !ALLOWED_MIME_TYPES.contains(detectedMime)) {
                log.warn("지원하지 않는 파일 형식 감지: detectedMime={}, originalName={}",
                        detectedMime, file.getOriginalFilename());
                throw new IllegalArgumentException(
                        "지원하지 않는 파일 형식입니다. (허용: JPEG, PNG, GIF, WebP)");
            }

            // 감지된 MIME 타입에서 확장자 결정 (원본 파일명 확장자 무시)
            String extension = MIME_TO_EXTENSION.get(detectedMime);

            // UUID + 타임스탬프로 고유한 파일명 생성 (사용자 ID 포함)
            String key = String.format("%s/%d/%d_%s%s",
                    folder,
                    userId,
                    System.currentTimeMillis(),
                    UUID.randomUUID().toString().substring(0, 8),
                    extension);

            // 감지된 MIME 타입으로 Content-Type 설정
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(detectedMime)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromBytes(fileBytes));

            String imageUrl = publicUrl + "/" + key;
            log.info("이미지 업로드 완료: url={}, detectedMime={}", imageUrl, detectedMime);

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
     * 파일 기본 유효성 검증 (null, empty 체크)
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }
    }

    /**
     * 파일 바이트에서 실제 MIME 타입 감지 (매직 바이트 기반)
     * 클라이언트가 제공한 Content-Type이나 확장자를 신뢰하지 않음
     */
    private String detectMimeType(byte[] fileBytes) {
        if (fileBytes == null || fileBytes.length < 12) {
            return null;
        }

        // JPEG: FF D8 FF
        if (startsWith(fileBytes, MAGIC_BYTES.get("image/jpeg"))) {
            return "image/jpeg";
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (startsWith(fileBytes, MAGIC_BYTES.get("image/png"))) {
            return "image/png";
        }

        // GIF: 47 49 46 38 (GIF8)
        if (startsWith(fileBytes, MAGIC_BYTES.get("image/gif"))) {
            return "image/gif";
        }

        // WebP: RIFF....WEBP (바이트 0-3: RIFF, 바이트 8-11: WEBP)
        if (startsWith(fileBytes, MAGIC_BYTES.get("image/webp")) && fileBytes.length >= 12) {
            if (fileBytes[8] == 'W' && fileBytes[9] == 'E' && fileBytes[10] == 'B' && fileBytes[11] == 'P') {
                return "image/webp";
            }
        }

        return null;
    }

    /**
     * 바이트 배열이 특정 시그니처로 시작하는지 확인
     */
    private boolean startsWith(byte[] data, byte[] signature) {
        if (data.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (data[i] != signature[i]) {
                return false;
            }
        }
        return true;
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
