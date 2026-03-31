package com.vnticket.service.impl;

import com.vnticket.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:vnticket.support@gmail.com}")
    private String fromEmail;

    @Async
    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, "VNTicket Support");
            helper.setTo(toEmail);
            helper.setSubject("VNTicket - Please verify your email for password reset");
            
            String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">" +
                    "<h2 style=\"color: #2e6c80;\">Password Reset Request</h2>" +
                    "<p>We received a request to reset the password for your VNTicket account associated with this email address.</p>" +
                    "<p>Your 6-digit OTP code is:</p>" +
                    "<h1 style=\"letter-spacing: 5px; color: #4CAF50; background: #f4f4f4; padding: 10px; width: fit-content; border-radius: 5px;\">" + otpCode + "</h1>" +
                    "<p>This code will expire in 5 minutes.</p>" +
                    "<p>If you did not request this password reset, please ignore this email.</p>" +
                    "<br><p>Best regards,<br>The VNTicket Team</p>" +
                    "</div>";
            
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
        }
    }
}
