package com.vnticket.service;

import com.vnticket.config.VnPayConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;

@Slf4j
@Service
public class VnPayService {

    private final VnPayConfig vnPayConfig;

    public VnPayService(VnPayConfig vnPayConfig) {
        this.vnPayConfig = vnPayConfig;
    }

    public String createPaymentUrl(Long bookingId,
            BigDecimal totalAmount,
            String orderInfo,
            String ipAddress) {

        long amount = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

        String createDate = LocalDateTime.now().format(formatter);
        String expireDate = LocalDateTime.now().plusMinutes(15).format(formatter);

        Map<String, String> params = new TreeMap<>();
        String txnRef = bookingId + "_" + System.currentTimeMillis();

        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        params.put("vnp_IpAddr", ipAddress);
        params.put("vnp_CreateDate", createDate);
        params.put("vnp_ExpireDate", expireDate);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        try {

            for (Map.Entry<String, String> entry : params.entrySet()) {

                String fieldName = entry.getKey();
                String fieldValue = entry.getValue();

                if (fieldValue == null || fieldValue.isEmpty())
                    continue;

                String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII);

                String encodedName = URLEncoder.encode(fieldName, StandardCharsets.US_ASCII);

                if (hashData.length() > 0) {
                    hashData.append("&");
                    query.append("&");
                }

                // Build hash data
                hashData.append(fieldName).append("=").append(encodedValue);

                // Build query
                query.append(encodedName).append("=").append(encodedValue);
            }

        } catch (Exception e) {
            throw new RuntimeException("VNPay encode error", e);
        }

        String secureHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());

        log.info("VNPay HashData: {}", hashData);

        return vnPayConfig.getPayUrl() + "?"
                + query
                + "&vnp_SecureHash=" + secureHash;
    }

    public boolean validateSignature(Map<String, String> params, String secureHash) {

        Map<String, String> sorted = new TreeMap<>(params);

        sorted.remove("vnp_SecureHash");
        sorted.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();

        try {

            for (Map.Entry<String, String> entry : sorted.entrySet()) {

                String fieldName = entry.getKey();
                String fieldValue = entry.getValue();

                if (fieldValue == null || fieldValue.isEmpty())
                    continue;

                String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString());

                if (hashData.length() > 0) {
                    hashData.append("&");
                }

                hashData.append(fieldName).append("=").append(encodedValue);
            }

        } catch (Exception e) {
            throw new RuntimeException("VNPay validate error", e);
        }

        String calculatedHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());

        log.info("VNPay Validate - HashData: {}", hashData);
        log.info("VNPay Validate - Calculated: {}", calculatedHash);
        log.info("VNPay Validate - Expected:   {}", secureHash);
        log.info("VNPay Validate - Match: {}", calculatedHash.equalsIgnoreCase(secureHash));

        return calculatedHash.equalsIgnoreCase(secureHash);
    }

    private String hmacSHA512(String key, String data) {

        try {

            Mac mac = Mac.getInstance("HmacSHA512");

            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");

            mac.init(secretKey);

            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder(2 * raw.length);

            for (byte b : raw) {
                hex.append(String.format("%02x", b & 0xff));
            }

            return hex.toString();

        } catch (Exception e) {
            throw new RuntimeException("HMAC error", e);
        }
    }
}