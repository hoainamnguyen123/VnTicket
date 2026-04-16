package com.vnticket.scheduler;

import com.vnticket.entity.*;
import com.vnticket.enums.BookingStatus;
import com.vnticket.enums.TicketStatus;
import com.vnticket.repository.BookingRepository;
import com.vnticket.repository.TicketTypeRepository;
import com.vnticket.service.TicketInventoryRedisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Cron job chính xử lý reservation hết hạn.
 * Chạy mỗi 30 giây, quét ZSET "reservations" tìm entry có score <= now.
 */
@Slf4j
@Component
public class ReservationCleanupTask {

    private final TicketInventoryRedisService inventoryRedisService;
    private final BookingRepository bookingRepository;
    private final TicketTypeRepository ticketTypeRepository;

    public ReservationCleanupTask(TicketInventoryRedisService inventoryRedisService,
                                  BookingRepository bookingRepository,
                                  TicketTypeRepository ticketTypeRepository) {
        this.inventoryRedisService = inventoryRedisService;
        this.bookingRepository = bookingRepository;
        this.ticketTypeRepository = ticketTypeRepository;
    }

    @Scheduled(fixedRate = 30000) // 30 giây
    @Transactional
    public void processExpiredReservations() {
        long now = System.currentTimeMillis();
        Set<String> expiredEntries = inventoryRedisService.getExpiredReservations(now);

        if (expiredEntries.isEmpty()) {
            return;
        }

        log.info("Found {} expired reservations to process", expiredEntries.size());

        for (String member : expiredEntries) {
            try {
                processExpiredMember(member);
            } catch (Exception e) {
                log.error("Failed to process expired reservation: {}. Error: {}", member, e.getMessage(), e);
            }
        }
    }

    private void processExpiredMember(String member) {
        // Parse: "bookingId|ticketTypeId|quantity"
        String[] parts = member.split("\\|");
        if (parts.length != 3) {
            log.warn("Invalid reservation format: {}, removing from ZSET", member);
            inventoryRedisService.removeReservationMember(member);
            return;
        }

        Long bookingId = Long.parseLong(parts[0]);
        Long ticketTypeId = Long.parseLong(parts[1]);
        int quantity = Integer.parseInt(parts[2]);

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            log.warn("Booking {} not found, removing stale reservation", bookingId);
            inventoryRedisService.removeReservationMember(member);
            return;
        }

        // ❗ Race condition guard: chỉ cancel nếu vẫn đang PENDING
        if (booking.getStatus() == BookingStatus.PENDING) {
            log.info("Cancelling expired reservation: bookingId={}, ticketTypeId={}, quantity={}",
                    bookingId, ticketTypeId, quantity);

            booking.setStatus(BookingStatus.CANCELLED);

            // Hoàn vé vào Redis (Vì lúc book chưa hề trừ DB)
            inventoryRedisService.incrementStock(ticketTypeId, quantity);

            // Hủy electronic tickets
            for (BookingDetail detail : booking.getBookingDetails()) {
                if (detail.getTickets() != null) {
                    detail.getTickets().forEach(t -> t.setStatus(TicketStatus.CANCELLED));
                }
            }

            bookingRepository.save(booking);
            log.info("Expired booking {} cancelled successfully", bookingId);
        } else {
            log.debug("Booking {} is no longer PENDING (status={}), skipping cancel", bookingId, booking.getStatus());
        }

        // Luôn xóa khỏi ZSET, kể cả đã PAID
        inventoryRedisService.removeReservationMember(member);
    }
}
