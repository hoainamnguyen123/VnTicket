package com.vnticket.controller;

import com.vnticket.dto.request.LoginRequest;
import com.vnticket.dto.request.SignupRequest;
import com.vnticket.dto.response.ApiResponse;
import com.vnticket.dto.response.JwtResponse;
import com.vnticket.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Processing login request for user: {}", loginRequest.getUsername());
        JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
        log.info("User {} logged in successfully", loginRequest.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User logged in successfully", jwtResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Object>> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        log.info("Processing registration request for user: {}", signUpRequest.getUsername());
        authService.registerUser(signUpRequest);
        log.info("User {} registered successfully", signUpRequest.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User registered successfully!", null));
    }
}
