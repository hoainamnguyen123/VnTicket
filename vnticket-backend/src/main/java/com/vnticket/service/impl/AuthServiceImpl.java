package com.vnticket.service.impl;

import com.vnticket.dto.request.LoginRequest;
import com.vnticket.dto.request.SignupRequest;
import com.vnticket.dto.response.JwtResponse;
import com.vnticket.enums.Role;
import com.vnticket.entity.User;
import com.vnticket.exception.BadRequestException;
import com.vnticket.repository.UserRepository;
import com.vnticket.security.jwt.JwtUtils;
import com.vnticket.security.services.UserDetailsImpl;
import com.vnticket.service.AuthService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.vnticket.service.EmailService;
import com.vnticket.dto.request.ForgotPasswordRequest;
import com.vnticket.dto.request.ResetPasswordRequest;
import java.util.concurrent.TimeUnit;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final StringRedisTemplate redisTemplate;
    private final EmailService emailService;

    @Value("${app.google.clientId}")
    private String googleClientId;

    public AuthServiceImpl(AuthenticationManager authenticationManager, UserRepository userRepository,
            PasswordEncoder encoder, JwtUtils jwtUtils, StringRedisTemplate redisTemplate, EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtUtils = jwtUtils;
        this.redisTemplate = redisTemplate;
        this.emailService = emailService;
    }

    @Override
    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        log.debug("Authenticating user: {}", loginRequest.getUsername());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        log.info("User {} authenticated successfully, assigned role: {}", userDetails.getUsername(), role);
        return new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                role);
    }

    @Override
    @Transactional
    public void registerUser(SignupRequest signUpRequest) {
        log.debug("Checking if username {} or email {} exists", signUpRequest.getUsername(), signUpRequest.getEmail());
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            log.error("Registration failed: Username {} is already taken", signUpRequest.getUsername());
            throw new BadRequestException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            log.error("Registration failed: Email {} is already in use", signUpRequest.getEmail());
            throw new BadRequestException("Error: Email is already in use!");
        }

        log.info("Creating new user account for: {}", signUpRequest.getUsername());
        // Create new user's account
        User user = User.builder()
                .username(signUpRequest.getUsername())
                .fullName(signUpRequest.getFullName())
                .email(signUpRequest.getEmail())
                .phone(signUpRequest.getPhone())
                .password(encoder.encode(signUpRequest.getPassword()))
                .role(Role.ROLE_USER)
                .build();

        userRepository.save(user);
        log.info("User {} saved successfully to database", user.getUsername());
    }

    @Override
    @Transactional
    public JwtResponse authenticateGoogleUser(String idTokenString) {
        log.info("Processing Google login");

        // 1. Verify Google ID Token
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(idTokenString);
        } catch (Exception e) {
            log.error("Google token verification failed: {}", e.getMessage());
            throw new BadRequestException("Google token không hợp lệ!");
        }

        if (idToken == null) {
            throw new BadRequestException("Google token không hợp lệ hoặc đã hết hạn!");
        }

        // 2. Extract user info from Google token
        GoogleIdToken.Payload payload = idToken.getPayload();
        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String fullName = (String) payload.get("name");

        log.info("Google login for email: {}, googleId: {}", email, googleId);

        // 3. Find or create user
        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .map(existingUser -> {
                            // Link Google ID to existing account
                            existingUser.setGoogleId(googleId);
                            if (fullName != null && existingUser.getFullName() == null) {
                                existingUser.setFullName(fullName);
                            }
                            return userRepository.save(existingUser);
                        })
                        .orElseGet(() -> {
                            // Create new user
                            String username = email.split("@")[0];
                            // Ensure username is unique
                            if (userRepository.existsByUsername(username)) {
                                username = username + "_" + UUID.randomUUID().toString().substring(0, 4);
                            }

                            log.info("Creating new Google user: {}", username);
                            User newUser = User.builder()
                                    .username(username)
                                    .email(email)
                                    .fullName(fullName)
                                    .password(encoder.encode(UUID.randomUUID().toString()))
                                    .googleId(googleId)
                                    .role(Role.ROLE_USER)
                                    .build();
                            return userRepository.save(newUser);
                        }));

        // 4. Generate JWT
        String jwt = jwtUtils.generateTokenFromUsername(user.getUsername());

        log.info("Google user {} authenticated successfully", user.getUsername());
        return new JwtResponse(jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name());
    }

    @Override
    public void processForgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail();
        
        // 1. Check user exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email không tồn tại trong hệ thống"));
                
        // 2. Rate limiting check
        String rateLimitKey = "rate_limit:forgot_password:" + email;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(rateLimitKey))) {
            throw new BadRequestException("Bạn vừa gửi yêu cầu. Vui lòng đợi 60 giây để thử lại.");
        }
        
        // Check daily limit (e.g. max 5 times per day)
        String dailyLimitKey = "daily_limit:forgot_password:" + email;
        String dailyStr = redisTemplate.opsForValue().get(dailyLimitKey);
        int dailyCount = dailyStr != null ? Integer.parseInt(dailyStr) : 0;
        
        if (dailyCount >= 5) {
            throw new BadRequestException("Bạn đã vượt quá giới hạn gửi OTP trong ngày.");
        }

        // 3. Generate OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        // 4. Save to Redis
        String otpKey = "otp:forgot_password:" + email;
        redisTemplate.opsForValue().set(otpKey, otp, 5, TimeUnit.MINUTES);
        
        // 5. Update limits
        redisTemplate.opsForValue().set(rateLimitKey, "1", 60, TimeUnit.SECONDS);
        if (dailyCount == 0) {
            redisTemplate.opsForValue().set(dailyLimitKey, "1", 24, TimeUnit.HOURS);
        } else {
            redisTemplate.opsForValue().increment(dailyLimitKey);
        }
        
        // 6. Send Email
        emailService.sendOtpEmail(email, otp);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail();
        String providedOtp = request.getOtp();
        String newPassword = request.getNewPassword();
        
        String otpKey = "otp:forgot_password:" + email;
        String savedOtp = redisTemplate.opsForValue().get(otpKey);
        
        if (savedOtp == null) {
            throw new BadRequestException("Mã OTP đã hết hạn hoặc không tồn tại.");
        }
        
        if (!savedOtp.equals(providedOtp)) {
            throw new BadRequestException("Mã OTP không chính xác.");
        }
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Người dùng không tồn tại."));
                
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
        
        // Xóa OTP sau khi sử dụng thành công
        redisTemplate.delete(otpKey);
    }
}

