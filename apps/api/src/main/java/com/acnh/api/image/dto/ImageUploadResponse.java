package com.acnh.api.image.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 이미지 업로드 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadResponse {

    private List<String> urls;
    private int uploadedCount;

    public static ImageUploadResponse of(List<String> urls) {
        return ImageUploadResponse.builder()
                .urls(urls)
                .uploadedCount(urls.size())
                .build();
    }
}
