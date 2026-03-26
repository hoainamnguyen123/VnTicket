package com.vnticket.exception;

import com.vnticket.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import com.vnticket.exception.TokenRefreshException;

import java.util.stream.Collectors;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

        private String getTraceId() {
                return MDC.get("traceId");
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
                log.warn("ResourceNotFoundException handled: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), ex.getMessage(), getTraceId()));
        }

        @ExceptionHandler(BadRequestException.class)
        public ResponseEntity<ApiResponse<Object>> handleBadRequestException(BadRequestException ex) {
                log.warn("BadRequestException handled: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), ex.getMessage(), getTraceId()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
                String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                                .collect(Collectors.joining(", "));
                log.warn("MethodArgumentNotValidException handled: Validation failed for fields: {}", errorMessage);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), errorMessage, getTraceId()));
        }

        @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
        public ResponseEntity<ApiResponse<Object>> handleOptimisticLockingFailureException(
                        ObjectOptimisticLockingFailureException ex) {
                log.warn("ObjectOptimisticLockingFailureException handled: Optimistic locking conflict occurred", ex);
                return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(ApiResponse.error(HttpStatus.CONFLICT.value(),
                                                "Tickets for this zone have just been modified by another user. Please try again or refresh the page.",
                                                getTraceId()));
        }

        @ExceptionHandler({ BadCredentialsException.class, InternalAuthenticationServiceException.class })
        public ResponseEntity<ApiResponse<Object>> handleBadCredentialsException(Exception ex) {
                log.warn("Auth Exception handled: Invalid login attempt - {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(),
                                                "Tài khoản hoặc mật khẩu không chính xác!", getTraceId()));
        }

        @ExceptionHandler(TokenRefreshException.class)
        public ResponseEntity<ApiResponse<Object>> handleTokenRefreshException(TokenRefreshException ex) {
                log.warn("TokenRefreshException handled: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), ex.getMessage(), getTraceId()));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex) {
                log.error("Unhandled Exception caught globally: ", ex);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                                "Internal Server Error: " + ex.getMessage(), getTraceId()));
        }
}
