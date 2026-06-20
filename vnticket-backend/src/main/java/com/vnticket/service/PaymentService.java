package com.vnticket.service;

import java.util.Map;

public interface PaymentService {

    String createPayment(Long bookingId, Long userId, String ipAddress);

    Map<String, String> processIpn(Map<String, String> params);

    boolean processReturn(Map<String, String> params);
}
