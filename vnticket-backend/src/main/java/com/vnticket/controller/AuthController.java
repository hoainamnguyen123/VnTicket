package com.vnticket.controller;

import com.vnticket.dto.request.LoginRequest;
import com.vnticket.dto.request.SignupRequest;
import com.vnticket.dto.request.GoogleLoginRequest;
import com.vnticket.dto.request.ForgotPasswordRequest;
import com.vnticket.dto.request.ResetPasswordRequest;
import com.vnticket.dto.response.ApiResponse;
import com.vnticket.dto.response.JwtResponse;
import com.vnticket.exception.TokenRefreshException;
import com.vnticket.repository.UserRepository;
import com.vnticket.security.jwt.JwtUtils;
import com.vnticket.security.services.RefreshTokenService;
import com.vnticket.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, RefreshTokenService refreshTokenService, JwtUtils jwtUtils,
            UserRepository userRepository) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Processing login request for user: {}", loginRequest.getUsername());
        JwtResponse jwtResponse = authService.authenticateUser(loginRequest);

        // Tạo refresh token → Redis lưu dạng "refresh:<token>" = "<userId>" kèm TTL
        String refreshTokenStr = refreshTokenService.createRefreshToken(jwtResponse.getId());

        ResponseCookie jwtRefreshCookie = ResponseCookie.from("vnticket-refresh", refreshTokenStr)
                .maxAge(30 * 24 * 60 * 60) // 30 days
                .httpOnly(true)
                .secure(false)
                .path("/api/auth")
                .build();

        log.info("User {} logged in successfully", loginRequest.getUsername());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtRefreshCookie.toString())
                .body(ApiResponse.success("User logged in successfully", jwtResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Object>> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        log.info("Processing registration request for user: {}", signUpRequest.getUsername());
        authService.registerUser(signUpRequest);
        log.info("User {} registered successfully", signUpRequest.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User registered successfully!", null));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<JwtResponse>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        log.info("Processing Google login request");
        JwtResponse jwtResponse = authService.authenticateGoogleUser(request.getIdToken());

        // Tạo refresh token
        String refreshTokenStr = refreshTokenService.createRefreshToken(jwtResponse.getId());

        ResponseCookie jwtRefreshCookie = ResponseCookie.from("vnticket-refresh", refreshTokenStr)
                .maxAge(30 * 24 * 60 * 60) // 30 days
                .httpOnly(true)
                .secure(false)
                .path("/api/auth")
                .build();

        log.info("Google user {} logged in successfully", jwtResponse.getUsername());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtRefreshCookie.toString())
                .body(ApiResponse.success("Google login successful", jwtResponse));
    }

    @PostMapping("/refreshtoken")
    public ResponseEntity<ApiResponse<JwtResponse>> refreshtoken(
            @CookieValue(name = "vnticket-refresh", required = false) String requestRefreshToken) {
        if (requestRefreshToken == null || requestRefreshToken.isEmpty()) {
            throw new TokenRefreshException("Unknown", "Refresh Token is empty!");
        }

        // Tìm userId từ Redis bằng token string
        return refreshTokenService.findUserIdByToken(requestRefreshToken)
                .flatMap(userId -> userRepository.findById(userId))
                .map(user -> {
                    log.info("🔄 Refreshing new access token successfully for user: {}", user.getUsername());
                    String accessToken = jwtUtils.generateTokenFromUsername(user.getUsername());
                    JwtResponse response = JwtResponse.builder()
                            .token(accessToken)
                            .id(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .role(user.getRole().name())
                            .build();
                    return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully!", response));
                })
                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken,
                        "Refresh token không tồn tại hoặc đã hết hạn!"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Object>> logoutUser(
            @CookieValue(name = "vnticket-refresh", required = false) String requestRefreshToken) {
        // Xóa key trong Redis ngay lập tức
        if (requestRefreshToken != null && !requestRefreshToken.isEmpty()) {
            refreshTokenService.deleteByToken(requestRefreshToken);
        }

        // Xóa cookie trên trình duyệt
        ResponseCookie jwtRefreshCookie = ResponseCookie.from("vnticket-refresh", "")
                .maxAge(0)
                .httpOnly(true)
                .path("/api/auth")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtRefreshCookie.toString())
                .body(ApiResponse.success("You've been signed out!", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Object>> processForgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Processing forgot password for email: {}", request.getEmail());
        authService.processForgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi đến email của bạn.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Processing reset password for email: {}", request.getEmail());
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.", null));
    }
}
