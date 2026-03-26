package com.vnticket.scheduler;

import com.vnticket.service.BookingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class BookingCleanupTask {

    private final BookingService bookingService;

    public BookingCleanupTask(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // Safety net: run every 5 minutes (main handler is ReservationCleanupTask)
    @Scheduled(fixedRate = 300000)
    public void cleanupExpiredBookings() {
        log.debug("Running Scheduled Task: cleanupExpiredBookings");
        try {
            bookingService.cancelExpiredBookings();
        } catch (Exception e) {
            log.error("Error occurred while cleaning up expired bookings: {}", e.getMessage(), e);
        }
    }
}
