package com.vnticket.service;

import com.vnticket.entity.Booking;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otpCode);
    void sendTicketConfirmationEmail(Booking booking);
    void sendEmailVerificationOtp(String toEmail, String otpCode);
}
