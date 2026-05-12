package com.vnticket.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;

/**
 * Service quản lý inventory vé trên Redis.
 *
 * Key patterns:
 *   - ticket_stock:{ticketTypeId}  → số vé còn lại (String/Integer)
 *   - ZSET "reservations"          → score = expireTime (epoch ms),
 *                                    value = "bookingId|ticketTypeId|quantity"
 */
@Slf4j
@Service
public class TicketInventoryRedisService {

    private static final String STOCK_PREFIX = "ticket_stock:";
    private static final String RESERVATIONS_KEY = "reservations";

    private static final String LUA_DECREMENT_SCRIPT =
            "local stock = tonumber(redis.call('GET', KEYS[1]) or '0') " +
            "if stock >= tonumber(ARGV[1]) then " +
            "  return redis.call('DECRBY', KEYS[1], ARGV[1]) " +
            "else " +
            "  return -1 " +
            "end";

    private final RedisScript<Long> decrementScript =
            new DefaultRedisScript<>(LUA_DECREMENT_SCRIPT, Long.class);

    private final StringRedisTemplate redisTemplate;

    public TicketInventoryRedisService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // ──────────────────── Stock Operations ────────────────────

    /**
     * Khởi tạo stock cho một loại vé trong Redis.
     */
    public void initStock(Long ticketTypeId, int quantity) {
        String key = STOCK_PREFIX + ticketTypeId;
        redisTemplate.opsForValue().set(key, String.valueOf(quantity));
        log.info("Initialized Redis stock for ticketTypeId={} → {}", ticketTypeId, quantity);
    }

    /**
     * Trừ vé bằng Lua Script — đảm bảo check + decrement nguyên tử (atomic).
     * Stock sẽ KHÔNG BAO GIỜ bị âm, tránh từ chối oan các request hợp lệ.
     *
     * @return true nếu trừ thành công, false nếu không đủ vé
     */
    public boolean decrementStock(Long ticketTypeId, int quantity) {
        String key = STOCK_PREFIX + ticketTypeId;
        Long result = redisTemplate.execute(
                decrementScript,
                List.of(key),                     // KEYS[1] = "ticket_stock:{id}"
                String.valueOf(quantity)           // ARGV[1] = số lượng cần trừ
        );

        if (result == null || result < 0) {
            log.warn("Lua decrementStock REJECTED: ticketTypeId={}, requested={} (not enough stock)",
                    ticketTypeId, quantity);
            return false;
        }

        log.debug("Lua decrementStock OK: ticketTypeId={}, decremented by {}, remaining={}",
                ticketTypeId, quantity, result);
        return true;
    }

    /**
     * Hoàn vé (tăng stock) khi hủy hoặc hết hạn reservation.
     */
    public void incrementStock(Long ticketTypeId, int quantity) {
        String key = STOCK_PREFIX + ticketTypeId;
        Long result = redisTemplate.opsForValue().increment(key, quantity);
        log.debug("Incremented stock for ticketTypeId={} by {}, new stock={}", ticketTypeId, quantity, result);
    }

    /**
     * Lấy stock hiện tại từ Redis.
     */
    public int getStock(Long ticketTypeId) {
        String key = STOCK_PREFIX + ticketTypeId;
        String value = redisTemplate.opsForValue().get(key);
        return value != null ? Integer.parseInt(value) : 0;
    }

    // ──────────────────── Reservation Operations (ZSET) ────────────────────

    /**
     * Thêm reservation vào ZSET.
     * value = "bookingId|ticketTypeId|quantity", score = expireTime (epoch ms).
     */
    public void addReservation(Long bookingId, Long ticketTypeId, int quantity, long expireTimeMs) {
        String member = bookingId + "|" + ticketTypeId + "|" + quantity;
        redisTemplate.opsForZSet().add(RESERVATIONS_KEY, member, expireTimeMs);
        log.debug("Added reservation: {} with expireTime={}", member, expireTimeMs);
    }

    /**
     * Xóa reservation khi thanh toán thành công hoặc đã xử lý hết hạn.
     */
    public void removeReservation(Long bookingId, Long ticketTypeId, int quantity) {
        String member = bookingId + "|" + ticketTypeId + "|" + quantity;
        redisTemplate.opsForZSet().remove(RESERVATIONS_KEY, member);
        log.debug("Removed reservation: {}", member);
    }

    /**
     * Lấy tất cả reservation đã hết hạn (score <= now).
     */
    public Set<String> getExpiredReservations(long nowMs) {
        Set<String> expired = redisTemplate.opsForZSet()
                .rangeByScore(RESERVATIONS_KEY, Double.NEGATIVE_INFINITY, nowMs);
        return expired != null ? expired : Collections.emptySet();
    }

    /**
     * Xóa một member cụ thể khỏi ZSET (dùng trong cleanup).
     */
    public void removeReservationMember(String member) {
        redisTemplate.opsForZSet().remove(RESERVATIONS_KEY, member);
        log.debug("Removed reservation member: {}", member);
    }
}
