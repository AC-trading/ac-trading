package com.acnh.api.common.exception;

/**
 * 리소스를 찾을 수 없을 때 발생하는 예외
 * HTTP 404 Not Found로 매핑됨
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String resourceName, Object id) {
        super(String.format("%s을(를) 찾을 수 없습니다: %s", resourceName, id));
    }
}
