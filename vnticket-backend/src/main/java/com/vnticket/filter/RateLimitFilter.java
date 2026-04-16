package com.vnticket.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filter đứng đầu tiên của ứng dụng để quét toàn bộ Request tràn vào.
 * Áp dụng thuật toán Token Bucket (mỗi IP có 1 xô chứa tối đa 20 Token/Giây).
 * Ngăn chặn tuyệt đối các đợt DDoS và Spam API quá giới hạn.
 */
@Component
@Order(1) // Đảm bảo Filter này chạy đầu tiên trước cả Security Filter
@Slf4j
public class RateLimitFilter implements Filter {

    // Ngăn kéo Lớp 1: Xô Nước Khổng Lồ chứa dung lượng toàn hệ thống (Global)
    private final Bucket globalBucket = Bucket.builder()
            .addLimit(Bandwidth.classic(500, Refill.greedy(500, Duration.ofSeconds(1))))
            .build();

    // Ngăn kéo Lớp 2: Bộ Nhớ Cache nội bộ lưu trữ trạng thái Xô (Bucket) theo từng chuỗi IP khách hàng.
    private final Map<String, Bucket> bucketCache = new ConcurrentHashMap<>();

    private Bucket resolveBucket(String ip) {
        return bucketCache.computeIfAbsent(ip, this::newBucket);
    }

    private Bucket newBucket(String ip) {
        // Thiết lập: Nạp lại tham lam (greedy) 20 điểm mỗi 1 giây. Max chứa 20 điểm.
        // Tức là trung bình cho phép Max: 20 Requests / Giây / 1 IP mạng.
        Refill refill = Refill.greedy(20, Duration.ofSeconds(1));
        Bandwidth limit = Bandwidth.classic(20, refill);
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        // Trích xuất Địa chỉ IP gốc của thiết bị
        String clientIp = getClientIP(request);

        // BƯỚC 1: KIỂM TRA QUÁ TẢI TOÀN HỆ THỐNG (GLOBAL FLASH SALE PUMP)
        if (!globalBucket.tryConsume(1)) {
            // Hệ thống hết sức chứa do hàng chục ngàn người ùa vào cùng 1 thời điểm.
            log.warn("Server reached 500 Req/s. Traffic blocked to protect Database!");

            response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value()); // 503
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{" +
                    "\"status\": 503," +
                    "\"error\": \"System Overload\"," +
                    "\"message\": \"Hàng đợi Flash Sale: Máy chủ đang đạt ngưỡng tối đa lực truy cập. Vui lòng xếp hàng và load lại sau vài giây!\"" +
                    "}");
            return; // Chặn đứng và đuổi về
        }

        // BƯỚC 2: KIỂM TRA TỪNG CÁ NHÂN (CHỐNG BOT/SPAM IP AUTO-CLICK)
        Bucket bucket = resolveBucket(clientIp);

        // Thử trừ đi 1 Token cá nhân xem còn không (Consume)
        if (bucket.tryConsume(1)) {
            // Đủ Token -> Hợp lệ -> Cho phép đi xuyên qua Filter vào Controller
            filterChain.doFilter(request, response);
        } else {
            // Cạn Token -> Bắt giữ lại -> Quăng lỗi
            log.warn("IP {} exceeded 20 Req/Sec. Auto-blocked to prevent DDoS!", clientIp);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{" +
                    "\"status\": 429," +
                    "\"error\": \"Too Many Requests\"," +
                    "\"message\": \"System Warning: Your IP address is sending too many requests. Please slow down!\"" +
                    "}");
        }
    }

    /**
     * Hàm lấy IP Gốc, bóc tách qua các lớp Mạng ảo Proxy/Nginx
     */
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0]; // Lấy IP thực đầu tiên trong chuỗi vượt Proxy
    }
}
