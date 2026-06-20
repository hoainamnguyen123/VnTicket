package com.vnticket.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

import com.vnticket.entity.TicketType;
import com.vnticket.enums.BookingStatus;
import com.vnticket.repository.BookingDetailRepository;
import com.vnticket.repository.TicketTypeRepository;

import java.time.Duration;
import java.time.LocalDateTime;
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
    private final TicketTypeRepository ticketTypeRepository;
    private final BookingDetailRepository bookingDetailRepository;

    @Value("${app.inventory.retention-hours-after-event:24}")
    private long retentionHoursAfterEvent;

    public TicketInventoryRedisService(StringRedisTemplate redisTemplate,
                                       TicketTypeRepository ticketTypeRepository,
                                       BookingDetailRepository bookingDetailRepository) {
        this.redisTemplate = redisTemplate;
        this.ticketTypeRepository = ticketTypeRepository;
        this.bookingDetailRepository = bookingDetailRepository;
    }

    /**
     * Đồng bộ lại stock từ DB (Cache Aside) khi key bị thiếu do Redis sập.
     * Chặn race condition bằng setIfAbsent.
     */
    private void ensureStockInitialized(Long ticketTypeId) {
        String key = STOCK_PREFIX + ticketTypeId;
        Boolean hasKey = redisTemplate.hasKey(key);
        if (Boolean.TRUE.equals(hasKey)) {
            return;
        }

        log.warn("Redis key {} is MISSING. Triggering Cache-Aside fallback to sync from DB...", key);

        TicketType ticketType = ticketTypeRepository.findById(ticketTypeId).orElse(null);
        if (ticketType == null) {
            log.error("TicketType {} not found in DB during fallback sync", ticketTypeId);
            return;
        }

        LocalDateTime pendingCutoff = LocalDateTime.now().minusMinutes(15);
        int dbStock = ticketType.getRemainingQuantity();
        int pendingQuantity = bookingDetailRepository
                .sumQuantityByTicketTypeAndBookingStatus(
                        ticketType.getId(),
                        BookingStatus.PENDING,
                        pendingCutoff
                );

        int effectiveStock = dbStock - pendingQuantity;
        if (effectiveStock < 0) {
            effectiveStock = 0;
        }

        // Dùng setIfAbsent để đảm bảo chỉ có 1 thread được set giá trị ban đầu nếu có nhiều thread cùng phát hiện rỗng
        Boolean initialized = redisTemplate.opsForValue().setIfAbsent(key, String.valueOf(effectiveStock));
        if (Boolean.TRUE.equals(initialized)) {
            applyStockTtl(key, ticketType.getEvent() != null ? ticketType.getEvent().getStartTime() : null);
        }
        log.info("Cache-Aside Sync OK: ticketTypeId={} → stock={}", ticketTypeId, effectiveStock);
    }

    // ──────────────────── Stock Operations ────────────────────

    /**
     * Khởi tạo stock cho một loại vé trong Redis.
     */
    public void initStock(Long ticketTypeId, int quantity) {
        initStock(ticketTypeId, quantity, null);
    }

    public void initStock(Long ticketTypeId, int quantity, LocalDateTime eventTime) {
        String key = STOCK_PREFIX + ticketTypeId;
        redisTemplate.opsForValue().set(key, String.valueOf(quantity));
        applyStockTtl(key, eventTime);
        log.info("Initialized Redis stock for ticketTypeId={} → {}, eventTime={}",
                ticketTypeId, quantity, eventTime);
    }

    /**
     * Trừ vé bằng Lua Script — đảm bảo check + decrement nguyên tử (atomic).
     * Stock sẽ KHÔNG BAO GIỜ bị âm, tránh từ chối oan các request hợp lệ.
     *
     * @return true nếu trừ thành công, false nếu không đủ vé
     */
    @CircuitBreaker(name = "redisInventory", fallbackMethod = "decrementStockFallback")
    public boolean decrementStock(Long ticketTypeId, int quantity) {
        ensureStockInitialized(ticketTypeId);

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
     * Fallback method cho decrementStock khi Circuit Breaker mở (Redis không khả dụng).
     * Trả về false để từ chối booking nhanh chóng thay vì chờ timeout.
     */
    public boolean decrementStockFallback(Long ticketTypeId, int quantity, Throwable e) {
        log.error("Circuit Breaker OPEN: Redis unavailable for decrementStock. ticketTypeId={}, quantity={}", 
                  ticketTypeId, quantity, e);
        return false;
    }

    /**
     * Hoàn vé (tăng stock) khi hủy hoặc hết hạn reservation.
     */
    @CircuitBreaker(name = "redisInventory", fallbackMethod = "incrementStockFallback")
    public void incrementStock(Long ticketTypeId, int quantity) {
        ensureStockInitialized(ticketTypeId);

        String key = STOCK_PREFIX + ticketTypeId;
        Long result = redisTemplate.opsForValue().increment(key, quantity);
        log.debug("Incremented stock for ticketTypeId={} by {}, new stock={}", ticketTypeId, quantity, result);
    }

    /**
     * Fallback method cho incrementStock khi Circuit Breaker mở.
     */
    public void incrementStockFallback(Long ticketTypeId, int quantity, Exception e) {
        log.error("Circuit Breaker OPEN: Redis unavailable for incrementStock. ticketTypeId={}, quantity={}", 
                  ticketTypeId, quantity, e);
        // Có thể cần lưu log lại db/file riêng để admin xử lý hoàn vé thủ công sau
    }

    /**
     * Lấy stock hiện tại từ Redis.
     */
    public int getStock(Long ticketTypeId) {
        ensureStockInitialized(ticketTypeId);

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

    private void applyStockTtl(String key, LocalDateTime eventTime) {
        if (eventTime == null) {
            return;
        }
        Duration ttl = Duration.between(
                LocalDateTime.now(),
                eventTime.plusHours(retentionHoursAfterEvent));
        if (ttl.isNegative() || ttl.isZero()) {
            redisTemplate.delete(key);
            return;
        }
        redisTemplate.expire(key, ttl);
    }
}
