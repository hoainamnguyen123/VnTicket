package com.vnticket.service.impl;

import com.vnticket.config.VnPayConfig;
import com.vnticket.entity.Booking;
import com.vnticket.enums.BookingStatus;
import com.vnticket.exception.BadRequestException;
import com.vnticket.service.BookingService;
import com.vnticket.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

@Slf4j
@Service
public class VnPayPaymentService implements PaymentService {

    private final VnPayConfig vnPayConfig;
    private final BookingService bookingService;

    public VnPayPaymentService(VnPayConfig vnPayConfig, BookingService bookingService) {
        this.vnPayConfig = vnPayConfig;
        this.bookingService = bookingService;
    }

    @Override
    public String createPayment(Long bookingId, Long userId, String ipAddress) {
        Booking booking = bookingService.validateBookingForPayment(bookingId, userId);
        return buildPaymentUrl(
                bookingId,
                booking.getTotalAmount(),
                "Thanh toan don hang VNTicket " + bookingId,
                ipAddress);
    }

    @Override
    public Map<String, String> processIpn(Map<String, String> params) {
        Map<String, String> result = new HashMap<>();
        if (!validateSignature(params, params.get("vnp_SecureHash"))) {
            result.put("RspCode", "97");
            result.put("Message", "Invalid signature");
            return result;
        }

        try {
            Long bookingId = extractBookingId(params.get("vnp_TxnRef"));
            Booking booking = bookingService.findBookingById(bookingId).orElse(null);
            if (booking == null) {
                result.put("RspCode", "01");
                result.put("Message", "Order not found");
                return result;
            }

            long paidAmount = Long.parseLong(params.getOrDefault("vnp_Amount", "0")) / 100;
            if (booking.getTotalAmount().compareTo(BigDecimal.valueOf(paidAmount)) != 0) {
                result.put("RspCode", "04");
                result.put("Message", "Invalid amount");
                return result;
            }

            if (booking.getStatus() != BookingStatus.PENDING) {
                result.put("RspCode", "02");
                result.put("Message", "Order already confirmed");
                return result;
            }

            if ("00".equals(params.get("vnp_ResponseCode"))
                    && "00".equals(params.get("vnp_TransactionStatus"))) {
                bookingService.confirmBookingPayment(bookingId);
            }
            result.put("RspCode", "00");
            result.put("Message", "Confirm Success");
        } catch (RuntimeException ex) {
            log.error("VNPay IPN processing failed", ex);
            result.put("RspCode", "99");
            result.put("Message", "Unknown error");
        }
        return result;
    }

    @Override
    public boolean processReturn(Map<String, String> params) {
        if (!validateSignature(params, params.get("vnp_SecureHash"))) {
            throw new BadRequestException("Invalid payment signature");
        }
        if (!"00".equals(params.get("vnp_ResponseCode"))) {
            return false;
        }

        Long bookingId = extractBookingId(params.get("vnp_TxnRef"));
        Booking booking = bookingService.findBookingById(bookingId)
                .orElseThrow(() -> new BadRequestException("Payment booking not found"));
        long paidAmount;
        try {
            paidAmount = Long.parseLong(params.getOrDefault("vnp_Amount", "0")) / 100;
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid payment amount");
        }
        if (booking.getTotalAmount().compareTo(BigDecimal.valueOf(paidAmount)) != 0) {
            throw new BadRequestException("Payment amount does not match booking total");
        }
        if (booking.getStatus() == BookingStatus.PAID) {
            return true;
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            return false;
        }
        bookingService.confirmBookingPayment(bookingId);
        return true;
    }

    private String buildPaymentUrl(Long bookingId, BigDecimal totalAmount, String orderInfo, String ipAddress) {
        long amount = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        LocalDateTime now = LocalDateTime.now();

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", bookingId + "_" + System.currentTimeMillis());
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        params.put("vnp_IpAddr", ipAddress);
        params.put("vnp_CreateDate", now.format(formatter));
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(formatter));

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        params.forEach((name, value) -> {
            if (value == null || value.isEmpty()) {
                return;
            }
            if (hashData.length() > 0) {
                hashData.append('&');
                query.append('&');
            }
            String encodedValue = encode(value);
            hashData.append(name).append('=').append(encodedValue);
            query.append(encode(name)).append('=').append(encodedValue);
        });

        return vnPayConfig.getPayUrl() + "?" + query
                + "&vnp_SecureHash=" + hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
    }

    private boolean validateSignature(Map<String, String> params, String secureHash) {
        if (secureHash == null || secureHash.isBlank()) {
            return false;
        }
        Map<String, String> sorted = new TreeMap<>(params);
        sorted.remove("vnp_SecureHash");
        sorted.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();
        sorted.forEach((name, value) -> {
            if (value == null || value.isEmpty()) {
                return;
            }
            if (hashData.length() > 0) {
                hashData.append('&');
            }
            hashData.append(name).append('=').append(encode(value));
        });

        byte[] calculated = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString())
                .getBytes(StandardCharsets.US_ASCII);
        byte[] received = secureHash.toLowerCase().getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(calculated, received);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(raw.length * 2);
            for (byte value : raw) {
                hex.append(String.format("%02x", value & 0xff));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign VNPay request", ex);
        }
    }

    private Long extractBookingId(String transactionReference) {
        if (transactionReference == null || transactionReference.isBlank()) {
            throw new BadRequestException("Missing payment transaction reference");
        }
        String bookingId = transactionReference.contains("_")
                ? transactionReference.substring(0, transactionReference.indexOf('_'))
                : transactionReference;
        try {
            return Long.parseLong(bookingId);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid payment transaction reference");
        }
    }
}
