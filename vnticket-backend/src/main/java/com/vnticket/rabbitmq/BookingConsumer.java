package com.vnticket.rabbitmq;

import com.vnticket.config.RabbitMQConfig;
import com.vnticket.dto.request.BookingMessageDTO;
import com.vnticket.service.BookingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.slf4j.MDC;

/**
 * Consumer xử lý booking message từ queue chính.
 *
 * QUAN TRỌNG: Không catch Exception bọc ngoài!
 * Nếu processBookingMessage() throw exception → message bị REJECT
 * → RabbitMQ tự động chuyển vào Dead Letter Queue (booking_queue_dlq)
 * → DLQConsumer sẽ hoàn stock Redis + log lỗi.
 *
 * Trước đây: catch Exception → nuốt lỗi → message biến mất → mất vé "trong không khí"
 * Bây giờ:   throw ra → RabbitMQ chuyển DLQ → DLQConsumer hoàn vé → không mất stock
 */
@Slf4j
@Service
public class BookingConsumer {

    private final BookingService bookingService;

    public BookingConsumer(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_BOOKING)
    public void receiveBookingMessage(BookingMessageDTO message) {
        if (message.getTraceId() != null) {
            MDC.put("traceId", message.getTraceId());
        } else {
            MDC.put("traceId", "RABBIT-WQ");
        }

        try {
            log.info("Consumed booking message for user ID {} and event ID {}",
                    message.getUserId(), message.getEventId());
            bookingService.processBookingMessage(message);
            log.info("Successfully processed booking for user ID {} and event ID {}",
                    message.getUserId(), message.getEventId());
        } finally {
            MDC.remove("traceId");
        }
        // Không catch Exception → exception throw ra ngoài
        // → RabbitMQ reject message → chuyển vào DLQ tự động
    }
}
