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
import java.util.UUID;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

    @Value("${app.google.clientId}")
    private String googleClientId;

    public AuthServiceImpl(AuthenticationManager authenticationManager, UserRepository userRepository,
            PasswordEncoder encoder, JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtUtils = jwtUtils;
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
}

