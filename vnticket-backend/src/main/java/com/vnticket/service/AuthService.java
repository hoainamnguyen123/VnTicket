package com.vnticket.service;

import com.vnticket.dto.request.LoginRequest;
import com.vnticket.dto.request.SignupRequest;
import com.vnticket.dto.response.JwtResponse;

public interface AuthService {
    JwtResponse authenticateUser(LoginRequest loginRequest);
    void registerUser(SignupRequest signUpRequest);
    JwtResponse authenticateGoogleUser(String idToken);
    void processForgotPassword(com.vnticket.dto.request.ForgotPasswordRequest request);
    void resetPassword(com.vnticket.dto.request.ResetPasswordRequest request);
    void sendEmailVerificationOtp(String email);
    void verifyEmail(String email, String otp);
}
