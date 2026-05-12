package com.vnticket.rabbitmq;

import com.vnticket.config.RabbitMQConfig;
import com.vnticket.dto.request.BookingMessageDTO;
import com.vnticket.service.TicketInventoryRedisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

/**
 * Consumer xử lý message thất bại từ Dead Letter Queue.
 *
 * Khi nào message vào đây?
 *   1. BookingConsumer throw exception (DB lỗi, data không hợp lệ, ...)
 *   2. RabbitMQ reject message và chuyển vào booking_queue_dlq
 *
 * Nhiệm vụ:
 *   1. HOÀN LẠI VÉ vào Redis — vì bookTicket() đã trừ stock (Lua Script)
 *      nhưng processBookingMessage() thất bại (chưa ghi DB)
 *      → Nếu không hoàn → vé "bốc hơi" khỏi hệ thống vĩnh viễn
 *   2. Log lỗi nghiêm trọng để admin biết và can thiệp thủ công nếu cần
 */
@Slf4j
@Service
public class DLQConsumer {

    private final TicketInventoryRedisService inventoryRedisService;

    public DLQConsumer(TicketInventoryRedisService inventoryRedisService) {
        this.inventoryRedisService = inventoryRedisService;
    }

    @RabbitListener(queues = RabbitMQConfig.DLQ_QUEUE)
    public void handleFailedBooking(BookingMessageDTO message) {
        log.error("🚨 [DLQ] Booking PERMANENTLY FAILED! userId={}, eventId={}, ticketTypeId={}, qty={}",
                message.getUserId(), message.getEventId(),
                message.getTicketTypeId(), message.getQuantity());

        // ═══ Hoàn lại stock vào Redis ═══
        // Lý do: bookTicket() đã trừ stock qua Lua Script ở bước đầu.
        //        Nhưng Consumer ghi DB thất bại → booking KHÔNG tồn tại trong DB.
        //        Nếu không hoàn → stock bị trừ mà không ai có vé → vé "bốc hơi".
        try {
            inventoryRedisService.incrementStock(
                    message.getTicketTypeId(), message.getQuantity());
            log.info("[DLQ] ✅ Restored {} tickets for ticketTypeId={}",
                    message.getQuantity(), message.getTicketTypeId());
        } catch (Exception e) {
            // Redis cũng lỗi → Cần can thiệp thủ công
            log.error("[DLQ] ❌ CRITICAL: Failed to restore stock for ticketTypeId={}! " +
                            "MANUAL INTERVENTION REQUIRED! Quantity to restore: {}",
                    message.getTicketTypeId(), message.getQuantity(), e);
        }
    }
}
