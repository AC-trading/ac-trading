package com.acnh.api.image.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

/**
 * 이미지 업로드/삭제 서비스
 * Cloudflare R2에 이미지를 저장하고 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImageService {

    private final S3Client s3Client;

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

    /**
     * 게시글용 이미지 업로드 (최대 10개)
     */
    public List<String> uploadPostImages(List<MultipartFile> files) {
        validateFileCount(files, maxPostImages, "게시글");
        return uploadImages(files, "posts");
    }

    /**
     * 채팅용 이미지 업로드 (최대 10개)
     */
    public List<String> uploadChatImages(List<MultipartFile> files) {
        validateFileCount(files, maxChatImages, "채팅");
        return uploadImages(files, "chat");
    }

    /**
     * 프로필 이미지 업로드 (단일)
     */
    public String uploadProfileImage(MultipartFile file) {
        validateFile(file);
        return uploadImage(file, "profiles");
    }

    /**
     * 이미지 삭제
     * @param imageUrl 삭제할 이미지의 전체 URL
     */
    public void deleteImage(String imageUrl) {
        try {
            // URL에서 키 추출 (publicUrl 이후 부분)
            String key = imageUrl.replace(publicUrl + "/", "");

            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("이미지 삭제 완료: {}", key);
        } catch (Exception e) {
            log.error("이미지 삭제 실패: {}", imageUrl, e);
            throw new RuntimeException("이미지 삭제에 실패했습니다.");
        }
    }

    /**
     * 여러 이미지 업로드 공통 로직
     */
    private List<String> uploadImages(List<MultipartFile> files, String folder) {
        List<String> uploadedUrls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = uploadImage(file, folder);
                uploadedUrls.add(url);
            }
        }

        return uploadedUrls;
    }

    /**
     * 단일 이미지 업로드
     */
    private String uploadImage(MultipartFile file, String folder) {
        validateFile(file);

        try {
            // UUID + 타임스탬프로 고유한 파일명 생성
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String key = String.format("%s/%d_%s%s",
                    folder,
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
}
