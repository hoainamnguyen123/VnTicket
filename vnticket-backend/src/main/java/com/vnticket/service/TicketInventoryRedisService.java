package com.vnticket.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
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
     * Trừ vé atomic. Nếu kết quả < 0 → rollback ngay và return false.
     */
    public boolean decrementStock(Long ticketTypeId, int quantity) {
        String key = STOCK_PREFIX + ticketTypeId;
        Long result = redisTemplate.opsForValue().decrement(key, quantity);

        if (result == null || result < 0) {
            // Rollback: khôi phục lại số vé đã trừ
            redisTemplate.opsForValue().increment(key, quantity);
            log.warn("Decrement failed for ticketTypeId={}: not enough stock (result={})", ticketTypeId, result);
            return false;
        }

        log.debug("Decremented stock for ticketTypeId={} by {}, remaining={}", ticketTypeId, quantity, result);
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
