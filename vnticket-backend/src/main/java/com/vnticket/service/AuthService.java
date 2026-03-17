package com.vnticket.service;

import com.vnticket.dto.request.LoginRequest;
import com.vnticket.dto.request.SignupRequest;
import com.vnticket.dto.response.JwtResponse;

public interface AuthService {
    JwtResponse authenticateUser(LoginRequest loginRequest);

    void registerUser(SignupRequest signUpRequest);

    JwtResponse authenticateGoogleUser(String idToken);
}
