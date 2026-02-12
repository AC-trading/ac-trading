package com.acnh.api.common.exception;

/**
 * 잘못된 요청일 때 발생하는 예외
 * HTTP 400 Bad Request로 매핑됨
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
