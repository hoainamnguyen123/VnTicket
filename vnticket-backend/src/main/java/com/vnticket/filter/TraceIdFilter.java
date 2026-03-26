package com.vnticket.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter tạo traceId duy nhất cho mỗi HTTP request.
 * - Gắn vào SLF4J MDC → hiển thị trong mọi dòng log.
 * - Gắn vào response header X-Trace-Id → client có thể đọc.
 * - Chạy trước mọi filter khác (Ordered.HIGHEST_PRECEDENCE).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    public static final String TRACE_ID_MDC_KEY = "traceId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // Tạo traceId ngắn 8 ký tự
            String traceId = UUID.randomUUID().toString().substring(0, 8);

            // Đặt vào MDC để hiển thị trong log
            MDC.put(TRACE_ID_MDC_KEY, traceId);

            // Đặt vào response header
            response.setHeader(TRACE_ID_HEADER, traceId);

            filterChain.doFilter(request, response);
        } finally {
            // Luôn xóa MDC sau khi request kết thúc để tránh leak giữa các thread
            MDC.remove(TRACE_ID_MDC_KEY);
        }
    }
}
