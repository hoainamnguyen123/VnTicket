package com.vnticket.security.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class RefreshTokenService {

    private static final String REFRESH_TOKEN_PREFIX = "refresh:";

    @Value("${app.jwt.jwtRefreshExpirationMs}")
    private Long refreshTokenDurationMs;

    private final StringRedisTemplate redisTemplate;

    public RefreshTokenService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Tạo refresh token mới cho user.
     * Lưu vào Redis dạng: KEY = "refresh:<token_string>" → VALUE = "<userId>"
     * Kèm TTL tự động hết hạn.
     */
    public String createRefreshToken(Long userId) {
        String token = UUID.randomUUID().toString();
        String key = REFRESH_TOKEN_PREFIX + token;

        redisTemplate.opsForValue().set(key, String.valueOf(userId),
                refreshTokenDurationMs, TimeUnit.MILLISECONDS);

        log.info("Created refresh token for userId={}, TTL={}ms", userId, refreshTokenDurationMs);
        return token;
    }

    /**
     * Tìm userId từ refresh token.
     * Nếu key không tồn tại (đã hết hạn hoặc đã bị xóa) → trả về Optional.empty()
     */
    public Optional<Long> findUserIdByToken(String token) {
        String key = REFRESH_TOKEN_PREFIX + token;
        String userIdStr = redisTemplate.opsForValue().get(key);
        if (userIdStr == null) {
            return Optional.empty();
        }
        return Optional.of(Long.parseLong(userIdStr));
    }

    public boolean deleteByToken(String token) {
        String key = REFRESH_TOKEN_PREFIX + token;
        Boolean deleted = redisTemplate.delete(key);
        log.info("Deleted refresh token: {}, result: {}", token, deleted);
        return Boolean.TRUE.equals(deleted);
    }
}
