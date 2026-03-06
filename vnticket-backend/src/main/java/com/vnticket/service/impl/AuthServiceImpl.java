package com.vnticket.service.impl;

import com.vnticket.dto.request.LoginRequest;
import com.vnticket.dto.request.SignupRequest;
import com.vnticket.dto.response.JwtResponse;
import com.vnticket.entity.Role;
import com.vnticket.entity.User;
import com.vnticket.exception.BadRequestException;
import com.vnticket.repository.UserRepository;
import com.vnticket.security.jwt.JwtUtils;
import com.vnticket.security.services.UserDetailsImpl;
import com.vnticket.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

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
}
