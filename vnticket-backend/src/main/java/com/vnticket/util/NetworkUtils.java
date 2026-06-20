package com.vnticket.util;

import jakarta.servlet.http.HttpServletRequest;

public final class NetworkUtils {

    private NetworkUtils() {
    }

    public static String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        String ipAddress = forwardedFor;
        if (ipAddress == null || ipAddress.isBlank() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        } else {
            ipAddress = ipAddress.split(",")[0].trim();
        }

        if ("0:0:0:0:0:0:0:1".equals(ipAddress) || "::1".equals(ipAddress)
                || "localhost".equalsIgnoreCase(ipAddress)) {
            return "127.0.0.1";
        }
        return ipAddress;
    }
}
