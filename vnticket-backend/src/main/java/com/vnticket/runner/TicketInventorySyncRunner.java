package com.vnticket.runner;

import com.vnticket.enums.BookingStatus;
import com.vnticket.repository.BookingDetailRepository;
import com.vnticket.repository.TicketTypeRepository;
import com.vnticket.service.TicketInventoryRedisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Đồng bộ stock từ DB → Redis khi ứng dụng khởi động.
 * Tính đúng: stock = remainingQuantity - SUM(PENDING chưa hết hạn).
 */
@Slf4j
@Component
public class TicketInventorySyncRunner implements ApplicationRunner {

    private final TicketTypeRepository ticketTypeRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final TicketInventoryRedisService inventoryRedisService;

    public TicketInventorySyncRunner(TicketTypeRepository ticketTypeRepository,
                                     BookingDetailRepository bookingDetailRepository,
                                     TicketInventoryRedisService inventoryRedisService) {
        this.ticketTypeRepository = ticketTypeRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.inventoryRedisService = inventoryRedisService;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("=== Starting Ticket Inventory Sync: DB → Redis ===");

        LocalDateTime pendingCutoff = LocalDateTime.now().minusMinutes(15);

        ticketTypeRepository.findAll().forEach(ticketType -> {
            int dbStock = ticketType.getRemainingQuantity();

            // Trừ đi số vé đang bị giữ bởi booking PENDING chưa hết hạn
            int pendingQuantity = bookingDetailRepository
                    .sumQuantityByTicketTypeAndBookingStatus(
                            ticketType.getId(),
                            BookingStatus.PENDING,
                            pendingCutoff
                    );

            int effectiveStock = dbStock - pendingQuantity;
            if (effectiveStock < 0) {
                log.warn("TicketType {} has negative effective stock (db={}, pending={}), clamping to 0",
                        ticketType.getId(), dbStock, pendingQuantity);
                effectiveStock = 0;
            }

            inventoryRedisService.initStock(ticketType.getId(), effectiveStock);
            log.info("Synced ticketTypeId={}: dbStock={}, pendingHeld={}, effectiveStock={}",
                    ticketType.getId(), dbStock, pendingQuantity, effectiveStock);
        });

        log.info("=== Ticket Inventory Sync Complete ===");
    }
}
