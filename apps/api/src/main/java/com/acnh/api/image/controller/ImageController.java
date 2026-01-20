package com.acnh.api.image.controller;

import com.acnh.api.image.dto.ImageUploadResponse;
import com.acnh.api.image.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 이미지 업로드 API
 * 게시글, 채팅, 프로필 이미지 업로드 엔드포인트 제공
 */
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    /**
     * 게시글 이미지 업로드 (최대 10개)
     * POST /api/images/posts
     */
    @PostMapping("/posts")
    public ResponseEntity<ImageUploadResponse> uploadPostImages(
            @RequestParam("files") List<MultipartFile> files) {
        List<String> urls = imageService.uploadPostImages(files);
        return ResponseEntity.ok(ImageUploadResponse.of(urls));
    }

    /**
     * 채팅 이미지 업로드 (최대 10개)
     * POST /api/images/chat
     */
    @PostMapping("/chat")
    public ResponseEntity<ImageUploadResponse> uploadChatImages(
            @RequestParam("files") List<MultipartFile> files) {
        List<String> urls = imageService.uploadChatImages(files);
        return ResponseEntity.ok(ImageUploadResponse.of(urls));
    }

    /**
     * 프로필 이미지 업로드 (단일)
     * POST /api/images/profile
     */
    @PostMapping("/profile")
    public ResponseEntity<ImageUploadResponse> uploadProfileImage(
            @RequestParam("file") MultipartFile file) {
        String url = imageService.uploadProfileImage(file);
        return ResponseEntity.ok(ImageUploadResponse.of(List.of(url)));
    }

    /**
     * 이미지 삭제
     * DELETE /api/images?url={imageUrl}
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteImage(@RequestParam("url") String imageUrl) {
        imageService.deleteImage(imageUrl);
        return ResponseEntity.noContent().build();
    }
}
