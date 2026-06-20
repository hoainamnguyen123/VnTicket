package com.vnticket.controller;

import com.vnticket.dto.response.ApiResponse;
import com.vnticket.service.BookingService;
import com.vnticket.service.PaymentService;
import com.vnticket.util.NetworkUtils;
import com.vnticket.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingService bookingService;

    public PaymentController(PaymentService paymentService, BookingService bookingService) {
        this.paymentService = paymentService;
        this.bookingService = bookingService;
    }

    @GetMapping("/create")
    public ResponseEntity<ApiResponse<String>> createPayment(
            @RequestParam("bookingId") Long bookingId,
            HttpServletRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        String paymentUrl = paymentService.createPayment(
                bookingId, userId, NetworkUtils.getClientIp(request));
        return ResponseEntity.ok(ApiResponse.success("Payment URL created", paymentUrl));
    }

    @PostMapping("/free-checkout")
    public ResponseEntity<ApiResponse<Void>> freeCheckout(@RequestParam("bookingId") Long bookingId) {
        Long userId = SecurityUtils.getCurrentUserId();
        bookingService.freeCheckout(bookingId, userId);
        return ResponseEntity.ok(ApiResponse.success("Free checkout completed", null));
    }

    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paymentService.processIpn(params));
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<ApiResponse<Void>> vnpayReturn(@RequestParam Map<String, String> params) {
        if (paymentService.processReturn(params)) {
            return ResponseEntity.ok(ApiResponse.success("Payment confirmed", null));
        }
        return ResponseEntity.ok(ApiResponse.error(1, "Payment failed or cancelled"));
    }
}
