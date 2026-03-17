package com.vnticket.controller;

import com.vnticket.dto.response.ApiResponse;
import com.vnticket.entity.Booking;
import com.vnticket.entity.BookingStatus;
import com.vnticket.exception.BadRequestException;
import com.vnticket.exception.ResourceNotFoundException;
import com.vnticket.repository.BookingRepository;
import com.vnticket.security.services.UserDetailsImpl;
import com.vnticket.service.BookingService;
import com.vnticket.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final VnPayService vnPayService;
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;

    public PaymentController(VnPayService vnPayService, BookingService bookingService,
            BookingRepository bookingRepository) {
        this.vnPayService = vnPayService;
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Tạo URL thanh toán VNPay cho booking
     * Frontend gọi API này → nhận URL ném user sang VNPay
     */
    @GetMapping("/create")
    public ResponseEntity<ApiResponse<String>> createPayment(@RequestParam("bookingId") Long bookingId,
            HttpServletRequest request) {

        Long userId = getCurrentUserId();
        log.info("User ID [{}] requesting VNPay payment for Booking ID: {}", userId, bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        // Kiểm tra booking thuộc user hiện tại
        if (!booking.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only pay for your own bookings");
        }

        // Kiểm tra trạng thái PENDING
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Booking is not in PENDING state");
        }

        // Kiểm tra hết hạn 15 phút
        if (java.time.Duration.between(booking.getBookingTime(), java.time.LocalDateTime.now()).toMinutes() >= 15) {
            throw new BadRequestException("Thời gian thanh toán đã hết hạn (15 phút).");
        }

        // Lấy IP của client
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }


        // Nếu là localhost, ép về IPv4 127.0.0.1
        if ("0:0:0:0:0:0:0:1".equals(ipAddress) || "localhost".equals(ipAddress)) {
            ipAddress = "127.0.0.1";
        }

        String orderInfo = "Thanh toan don hang VNTicket " + bookingId;
        String paymentUrl = vnPayService.createPaymentUrl(bookingId, booking.getTotalAmount(), orderInfo, ipAddress);

        return ResponseEntity.ok(ApiResponse.success("Payment URL created", paymentUrl));
    }

    /**
     * VNPay IPN (Instant Payment Notification) - Server-to-Server
     * VNPay gọi URL này sau khi user thanh toán xong
     * KHÔNG CẦN AUTHENTICATION (permitAll trong SecurityConfig)
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIPN(@RequestParam Map<String, String> params) {
        log.info("Received VNPay IPN callback with params: {}", params);

        Map<String, String> result = new HashMap<>();
        String vnpSecureHash = params.get("vnp_SecureHash");

        // 1. Validate chữ ký
        if (!vnPayService.validateSignature(params, vnpSecureHash)) {
            log.error("VNPay IPN: Invalid signature");
            result.put("RspCode", "97");
            result.put("Message", "Invalid signature");
            return ResponseEntity.ok(result);
        }

        // 2. Lấy thông tin từ VNPay
        String txnRef = params.get("vnp_TxnRef"); // Booking ID
        String responseCode = params.get("vnp_ResponseCode"); // 00 = thành công
        String transactionStatus = params.get("vnp_TransactionStatus");
        long vnpAmount = Long.parseLong(params.get("vnp_Amount")) / 100; // Chia 100 về đơn vị VND

        try {
            String actualBookingId = txnRef.contains("_") ? txnRef.split("_")[0] : txnRef;
            Long bookingId = Long.parseLong(actualBookingId);
            Booking booking = bookingRepository.findById(bookingId).orElse(null);

            // 3. Kiểm tra đơn hàng tồn tại
            if (booking == null) {
                log.error("VNPay IPN: Order not found for TxnRef: {}", txnRef);
                result.put("RspCode", "01");
                result.put("Message", "Order not found");
                return ResponseEntity.ok(result);
            }

            // 4. Kiểm tra số tiền
            if (booking.getTotalAmount().longValue() != vnpAmount) {
                log.error("VNPay IPN: Amount mismatch. Expected: {}, Got: {}", booking.getTotalAmount(), vnpAmount);
                result.put("RspCode", "04");
                result.put("Message", "Invalid amount");
                return ResponseEntity.ok(result);
            }

            // 5. Kiểm tra đã xử lý chưa (tránh xử lý trùng)
            if (booking.getStatus() != BookingStatus.PENDING) {
                log.warn("VNPay IPN: Order {} already processed with status {}", bookingId, booking.getStatus());
                result.put("RspCode", "02");
                result.put("Message", "Order already confirmed");
                return ResponseEntity.ok(result);
            }

            // 6. Cập nhật trạng thái
            if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
                bookingService.processVnPayPayment(bookingId);
                log.info("VNPay IPN: Payment successful for Booking ID: {}", bookingId);
            } else {
                log.warn("VNPay IPN: Payment failed for Booking ID: {}, ResponseCode: {}", bookingId, responseCode);
            }

            result.put("RspCode", "00");
            result.put("Message", "Confirm Success");

        } catch (Exception e) {
            log.error("VNPay IPN error: {}", e.getMessage(), e);
            result.put("RspCode", "99");
            result.put("Message", "Unknown error");
        }

        return ResponseEntity.ok(result);
    }

    /**
     * VNPay Return URL Verification - Called by Frontend
     * Giúp cập nhật DB ngay lập tức khi user quay lại trang web (đặc biệt hữu ích
     * khi IPN bị lỗi/không tới được localhost)
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<ApiResponse<Void>> vnpayReturn(@RequestParam Map<String, String> params) {
        log.info("Processing VNPay return verification with params: {}", params);

        String vnpSecureHash = params.get("vnp_SecureHash");

        // 1. Validate chữ ký
        if (!vnPayService.validateSignature(params, vnpSecureHash)) {
            log.error("VNPay Return: Invalid signature");
            throw new BadRequestException("Invalid payment signature");
        }

        // 2. Kiểm tra ResponseCode
        String responseCode = params.get("vnp_ResponseCode");
        if (!"00".equals(responseCode)) {
            log.warn("VNPay Return: Payment failed or cancelled with code: {}", responseCode);
            return ResponseEntity.ok(ApiResponse.error(1, "Payment failed or cancelled"));
        }

        // 3. Cập nhật trạng thái booking
        String txnRef = params.get("vnp_TxnRef"); // Booking ID
        try {
            String actualBookingId = txnRef.contains("_") ? txnRef.split("_")[0] : txnRef;
            Long bookingId = Long.parseLong(actualBookingId);
            bookingService.processVnPayPayment(bookingId);
            log.info("VNPay Return: Payment verified and processed for Booking ID: {}", bookingId);
            return ResponseEntity.ok(ApiResponse.success("Payment confirmed", null));
        } catch (Exception e) {
            log.error("VNPay Return: Error processing payment for TxnRef {}: {}", txnRef, e.getMessage());
            throw new BadRequestException("Error processing payment: " + e.getMessage());
        }
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            throw new BadRequestException("User not authenticated");
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }
}
