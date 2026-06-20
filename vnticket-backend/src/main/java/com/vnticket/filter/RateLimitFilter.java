package com.vnticket.filter;

import com.vnticket.util.NetworkUtils;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1)
@Slf4j
public class RateLimitFilter implements Filter {

    private static final long CLIENT_BUCKET_IDLE_MILLIS = Duration.ofMinutes(30).toMillis();

    private final int globalRequestsPerSecond;
    private final int clientRequestsPerSecond;
    private final Bucket globalBucket;
    private final Map<String, ClientBucket> clientBuckets = new ConcurrentHashMap<>();

    public RateLimitFilter(
            @Value("${app.rate-limit.global-per-second:2000}") int globalRequestsPerSecond,
            @Value("${app.rate-limit.per-ip-per-second:100}") int clientRequestsPerSecond) {
        this.globalRequestsPerSecond = positive(globalRequestsPerSecond, "global-per-second");
        this.clientRequestsPerSecond = positive(clientRequestsPerSecond, "per-ip-per-second");
        this.globalBucket = createBucket(this.globalRequestsPerSecond);
    }

    @Override
    public void doFilter(
            ServletRequest servletRequest,
            ServletResponse servletResponse,
            FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!globalBucket.tryConsume(1)) {
            log.warn("Global request rate exceeded {} requests/second", globalRequestsPerSecond);
            writeError(response, HttpStatus.SERVICE_UNAVAILABLE, "System Overload",
                    "The server is temporarily overloaded. Please retry shortly.");
            return;
        }

        String clientIp = NetworkUtils.getClientIp(request);
        ClientBucket clientBucket = clientBuckets.computeIfAbsent(
                clientIp, ignored -> new ClientBucket(createBucket(clientRequestsPerSecond)));
        clientBucket.touch();
        if (!clientBucket.bucket().tryConsume(1)) {
            log.warn("IP {} exceeded {} requests/second", clientIp, clientRequestsPerSecond);
            writeError(response, HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests",
                    "Your client is sending too many requests. Please slow down.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Scheduled(fixedDelayString = "${app.rate-limit.cleanup-interval-ms:600000}")
    public void removeIdleClientBuckets() {
        long cutoff = System.currentTimeMillis() - CLIENT_BUCKET_IDLE_MILLIS;
        clientBuckets.entrySet().removeIf(entry -> entry.getValue().lastSeenMillis() < cutoff);
    }

    private Bucket createBucket(int requestsPerSecond) {
        Bandwidth limit = Bandwidth.classic(
                requestsPerSecond,
                Refill.greedy(requestsPerSecond, Duration.ofSeconds(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    private void writeError(
            HttpServletResponse response,
            HttpStatus status,
            String error,
            String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("""
                {"status":%d,"error":"%s","message":"%s"}
                """.formatted(status.value(), error, message).trim());
    }

    private int positive(int value, String property) {
        if (value <= 0) {
            throw new IllegalArgumentException("Rate limit " + property + " must be greater than zero");
        }
        return value;
    }

    private static final class ClientBucket {
        private final Bucket bucket;
        private volatile long lastSeenMillis;

        private ClientBucket(Bucket bucket) {
            this.bucket = bucket;
            touch();
        }

        private Bucket bucket() {
            return bucket;
        }

        private long lastSeenMillis() {
            return lastSeenMillis;
        }

        private void touch() {
            lastSeenMillis = System.currentTimeMillis();
        }
    }
}
