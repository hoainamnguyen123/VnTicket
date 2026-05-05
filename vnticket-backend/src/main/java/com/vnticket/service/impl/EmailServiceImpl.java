package com.vnticket.service.impl;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.vnticket.entity.Booking;
import com.vnticket.entity.BookingDetail;
import com.vnticket.entity.Ticket;
import com.vnticket.repository.BookingRepository;
import com.vnticket.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final BookingRepository bookingRepository;

    @Value("${spring.mail.username:vnticket.support@gmail.com}")
    private String fromEmail;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String frontendUrl;

    // ─────────────────────────────────────────────────────
    // OTP Email
    // ─────────────────────────────────────────────────────

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
                    "<br><p>Best regards,<br>The VNTicket Team</p></div>";
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
        }
    }

    @Async
    @Override
    public void sendEmailVerificationOtp(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "VNTicket");
            helper.setTo(toEmail);
            helper.setSubject("VNTicket - Xác thực địa chỉ email của bạn");
            String html =
                "<div style=\"font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;\">" +
                "  <div style=\"background:linear-gradient(135deg,#6c5ce7,#a29bfe);border-radius:12px 12px 0 0;padding:28px;text-align:center;\">" +
                "    <div style=\"font-size:28px;\">✉️</div>" +
                "    <h2 style=\"color:#fff;margin:10px 0 4px;font-size:20px;font-weight:700;\">Xác thực tài khoản VNTicket</h2>" +
                "  </div>" +
                "  <div style=\"background:#fff;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 12px 12px;padding:28px;\">" +
                "    <p style=\"color:#2d3436;font-size:15px;margin:0 0 12px;\">Chào mừng bạn đến với VNTicket! 🎉</p>" +
                "    <p style=\"color:#636e72;font-size:14px;line-height:1.6;margin:0 0 20px;\">Mã xác thực của bạn là:</p>" +
                "    <div style=\"background:#f8f7ff;border:2px dashed #6c5ce7;border-radius:10px;padding:16px;text-align:center;margin-bottom:20px;\">" +
                "      <span style=\"font-size:32px;font-weight:800;letter-spacing:8px;color:#6c5ce7;\">" + otpCode + "</span>" +
                "    </div>" +
                "    <p style=\"color:#999;font-size:12px;margin:0;\">Mã có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này cho bất kỳ ai.</p>" +
                "  </div>" +
                "</div>";
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email verification OTP sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email verification OTP to: {}", toEmail, e);
        }
    }

    // ─────────────────────────────────────────────────────
    // Ticket Confirmation Email
    // ─────────────────────────────────────────────────────

    private record TicketQr(int index, byte[] qrBytes) {}

    @Async
    @Override
    @Transactional(readOnly = true)
    public void sendTicketConfirmationEmail(Booking bookingRef) {
        try {
            Booking booking = bookingRepository.findById(bookingRef.getId()).orElse(bookingRef);

            String toEmail       = booking.getUser().getEmail();
            String userName      = booking.getUser().getUsername();
            String eventName     = booking.getEvent().getName();
            String eventImageUrl = booking.getEvent().getImageUrl();
            String eventLocation = booking.getEvent().getLocation() != null
                    ? booking.getEvent().getLocation() : "Chưa cập nhật";
            String eventStartTime = booking.getEvent().getStartTime() != null
                    ? booking.getEvent().getStartTime().format(DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy"))
                    : "Chưa cập nhật";

            NumberFormat fmt = NumberFormat.getInstance(new Locale("vi", "VN"));

            // Lấy URL gốc (bỏ phần ,secondUrl nếu CORS có nhiều origins)
            String webUrl = frontendUrl.split(",")[0].trim();

            // Build từng ticket card riêng biệt
            StringBuilder ticketCardsHtml = new StringBuilder();
            List<TicketQr> qrList = new ArrayList<>();
            int ticketIndex = 1;
            int totalTickets = 0;

            for (BookingDetail detail : booking.getBookingDetails()) {
                String zoneName = detail.getTicketType().getZoneName();
                BigDecimal price = detail.getPrice();
                List<Ticket> tickets = detail.getTickets();
                if (tickets == null) continue;

                for (Ticket ticket : tickets) {
                    byte[] qrBytes = generateQrBytes(ticket.getTicketCode());
                    String qrCid = "qr_" + ticketIndex;
                    if (qrBytes != null) qrList.add(new TicketQr(ticketIndex, qrBytes));

                    ticketCardsHtml.append(buildTicketCard(
                            ticketIndex, ticket.getTicketCode(),
                            eventName, eventImageUrl, eventLocation, eventStartTime,
                            zoneName, price, fmt,
                            qrBytes != null ? qrCid : null
                    ));
                    ticketIndex++;
                    totalTickets++;
                }
            }

            String totalFormatted = fmt.format(booking.getTotalAmount()) + " ₫";
            String htmlContent = buildEmailHtml(userName, eventName, ticketCardsHtml.toString(), totalTickets, totalFormatted, webUrl);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_RELATED, "UTF-8");
            helper.setFrom(fromEmail, "VNTicket");
            helper.setTo(toEmail);
            helper.setSubject("🎟️ VNTicket - Vé của bạn cho sự kiện: " + eventName);
            helper.setText(htmlContent, true);

            for (TicketQr qr : qrList) {
                helper.addInline("qr_" + qr.index(), new ByteArrayResource(qr.qrBytes()), "image/png");
            }

            mailSender.send(message);
            log.info("Ticket confirmation email sent to {} for booking ID {}", toEmail, booking.getId());
        } catch (Exception e) {
            log.error("Failed to send ticket confirmation email for booking ID {}", bookingRef.getId(), e);
        }
    }

    // ─────────────────────────────────────────────────────
    // QR Code Generator
    // ─────────────────────────────────────────────────────

    private byte[] generateQrBytes(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, 300, 300);
            BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.warn("Failed to generate QR code for ticket: {}", content, e);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────
    // Ticket Card — giống web: ảnh trên, thông tin giữa, QR + mã dưới
    // Dùng <table> để tương thích tối đa với email client
    // ─────────────────────────────────────────────────────

    private String buildTicketCard(int index, String ticketCode,
                                   String eventName, String eventImageUrl,
                                   String eventLocation, String eventStartTime,
                                   String zoneName, BigDecimal price, NumberFormat fmt,
                                   String qrCid) {

        // Ảnh sự kiện + badge HỢP LỆ overlay (dùng position relative trick bằng table)
        String imgSection = "";
        if (eventImageUrl != null && !eventImageUrl.isBlank()) {
            imgSection =
                "<div style=\"position:relative; line-height:0;\">" +
                "  <img src=\"" + eventImageUrl + "\" alt=\"" + eventName + "\" " +
                "       style=\"width:100%; max-height:200px; object-fit:cover; display:block; border-radius:14px 14px 0 0;\"/>" +
                "  <span style=\"position:absolute; top:12px; right:12px; background:#00b894; color:#fff; " +
                "               font-size:12px; font-weight:700; padding:4px 14px; border-radius:20px; " +
                "               letter-spacing:0.5px;\">HỢP LỆ</span>" +
                "</div>";
        }

        // QR section
        String qrSection = "";
        if (qrCid != null) {
            qrSection =
                "<div style=\"text-align:center; padding:20px 0 8px;\">" +
                "  <div style=\"display:inline-block; background:#fff; border:1px solid #e8e8e8; border-radius:12px; padding:12px;\">" +
                "    <img src=\"cid:" + qrCid + "\" width=\"160\" height=\"160\" alt=\"QR Code\" style=\"display:block;\"/>" +
                "  </div>" +
                "  <div style=\"font-size:11px; color:#999; margin-top:8px;\">Quét mã QR tại cổng vào</div>" +
                "</div>";
        }

        return
            // Wrapper card
            "<div style=\"background:#fff; border:1px solid #e8e8e8; border-radius:14px; " +
            "            margin-bottom:24px; overflow:hidden; box-shadow:0 4px 16px rgba(108,92,231,0.10);\">" +

            // --- Phần 1: Ảnh sự kiện ---
            imgSection +

            // --- Phần 2: Tên sự kiện + thông tin ---
            "<div style=\"padding:20px 24px 0;\">" +
            "  <div style=\"font-size:17px; font-weight:700; color:#6c5ce7; margin-bottom:14px;\">" + eventName + "</div>" +

            "  <div style=\"margin-bottom:8px;\">" +
            "    <div style=\"font-size:11px; color:#999; margin-bottom:2px;\">Thời gian:</div>" +
            "    <div style=\"font-size:14px; font-weight:600; color:#2d3436;\">lúc " + eventStartTime + "</div>" +
            "  </div>" +

            "  <div style=\"margin-bottom:16px;\">" +
            "    <div style=\"font-size:11px; color:#999; margin-bottom:2px;\">Địa điểm:</div>" +
            "    <div style=\"font-size:14px; font-weight:600; color:#2d3436;\">" + eventLocation + "</div>" +
            "  </div>" +
            "</div>" +

            // --- Đường kẻ đứt ---
            "<div style=\"border-top:1.5px dashed #e0e0e0; margin:0 24px;\"></div>" +

            // --- Phần 3: Khu vực + Giá vé (2 cột) ---
            "<div style=\"padding:14px 24px; display:flex; justify-content:space-between;\">" +
            "  <div style=\"text-align:center; flex:1;\">" +
            "    <div style=\"font-size:11px; color:#999; margin-bottom:4px;\">Khu vực</div>" +
            "    <div style=\"font-size:14px; font-weight:700; color:#2d3436;\">" + zoneName + "</div>" +
            "  </div>" +
            "  <div style=\"width:1px; background:#e8e8e8;\"></div>" +
            "  <div style=\"text-align:center; flex:1;\">" +
            "    <div style=\"font-size:11px; color:#999; margin-bottom:4px;\">Giá vé</div>" +
            "    <div style=\"font-size:14px; font-weight:700; color:#e17055;\">" + fmt.format(price) + " đ</div>" +
            "  </div>" +
            "</div>" +

            // --- Đường kẻ đứt ---
            "<div style=\"border-top:1.5px dashed #e0e0e0; margin:0 24px;\"></div>" +

            // --- Phần 4: QR Code ---
            qrSection +

            // --- Phần 5: Mã vé điện tử ---
            "<div style=\"text-align:center; padding:0 24px 20px;\">" +
            "  <div style=\"font-size:11px; color:#999; margin-bottom:6px;\">Mã vé điện tử</div>" +
            "  <div style=\"font-family:'Courier New',monospace; font-size:16px; font-weight:700; " +
            "               color:#2d3436; letter-spacing:1.5px; word-break:break-all;\">" + ticketCode + "</div>" +
            "</div>" +

            "</div>";
    }

    // ─────────────────────────────────────────────────────
    // Email wrapper HTML
    // ─────────────────────────────────────────────────────

    private String buildEmailHtml(String userName, String eventName,
                                  String ticketCardsHtml, int totalTickets,
                                  String totalFormatted, String webUrl) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>" +
               "<body style=\"margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;\">" +
               "<div style=\"max-width:620px;margin:30px auto;\">" +

               // Header
               "<div style=\"background:linear-gradient(135deg,#6c5ce7,#a29bfe);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;\">" +
               "  <div style=\"font-size:32px;\">🎟️</div>" +
               "  <h1 style=\"color:#fff;margin:10px 0 4px;font-size:24px;font-weight:800;\">Đặt vé thành công!</h1>" +
               "  <p style=\"color:rgba(255,255,255,0.85);margin:0;font-size:14px;\">Cảm ơn bạn đã sử dụng VNTicket</p>" +
               "</div>" +

               // Body
               "<div style=\"background:#f0f2f5;padding:24px 16px;\">" +
               "  <p style=\"color:#2d3436;font-size:15px;margin:0 0 6px;\">Xin chào <strong>" + userName + "</strong>,</p>" +
               "  <p style=\"color:#636e72;font-size:14px;line-height:1.6;margin:0 0 20px;\">Đơn đặt vé <strong>\"" + eventName + "\"</strong> của bạn đã được xác nhận. Dưới đây là vé điện tử của bạn.</p>" +

               // Ticket cards
               ticketCardsHtml +

               // Total box
               "<div style=\"background:#fff;border-radius:12px;padding:16px 24px;margin-bottom:16px;border:1px solid #e8e8e8;\">" +
               "  <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;\">" +
               "    <span style=\"color:#636e72;font-size:13px;\">Số lượng vé</span>" +
               "    <span style=\"color:#2d3436;font-weight:700;font-size:14px;\">" + totalTickets + " vé</span>" +
               "  </div>" +
               "  <div style=\"border-top:1px solid #f0f0f0;margin-bottom:10px;\"></div>" +
               "  <div style=\"display:flex;justify-content:space-between;align-items:center;\">" +
               "    <span style=\"color:#636e72;font-weight:600;font-size:14px;\">Tổng thanh toán</span>" +
               "    <span style=\"color:#6c5ce7;font-weight:800;font-size:18px;\">" + totalFormatted + "</span>" +
               "  </div>" +
               "</div>" +

               // Note: soát vé
               "<div style=\"background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:12px;border:1px solid #ffe58f;\">" +
               "  <p style=\"margin:0;font-size:13px;color:#7d6608;\">⚠️ <strong>Lưu ý:</strong> Vui lòng xuất trình mã QR hoặc mã vé tại cổng soát vé. Mỗi mã vé chỉ sử dụng được <strong>một lần</strong>.</p>" +
               "</div>" +

               // Note: tặng vé
               "<div style=\"background:#fff;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid #b2f0d8;\">" +
               "  <p style=\"margin:0 0 8px;font-size:13px;color:#00664f;\">🎁 <strong>Bạn muốn tặng vé cho người thân?</strong></p>" +
               "  <p style=\"margin:0 0 10px;font-size:13px;color:#636e72;line-height:1.6;\">VNTicket cho phép bạn chuyển vé cho bạn bè hoặc người thân chỉ với vài thao tác. Truy cập mục <strong>Vé của tôi</strong> trên website để thực hiện.</p>" +
               "  <a href=\"" + webUrl + "/history\" " +
               "     style=\"display:inline-block;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;" +
               "             padding:9px 20px;border-radius:20px;font-size:13px;font-weight:600;text-decoration:none;\">Xem vé &amp; chuyển vé →</a>" +
               "</div>" +

               "</div>" +

               // Footer
               "<div style=\"background:#2d3436;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;\">" +
               "  <p style=\"color:rgba(255,255,255,0.6);font-size:12px;margin:0;\">© 2025 VNTicket. Liên hệ: " +
               "<a href='mailto:" + fromEmail + "' style='color:#a29bfe;'>" + fromEmail + "</a></p>" +
               "</div>" +

               "</div></body></html>";
    }
}
