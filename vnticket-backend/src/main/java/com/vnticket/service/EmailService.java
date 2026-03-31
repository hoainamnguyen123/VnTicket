package com.vnticket.service;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otpCode);
}
