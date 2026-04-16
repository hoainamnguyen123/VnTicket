package com.vnticket.rabbitmq;

import com.vnticket.config.RabbitMQConfig;
import com.vnticket.dto.request.BookingMessageDTO;
import com.vnticket.service.BookingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.slf4j.MDC;

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
            log.info("Consumed booking message from RabbitMQ for user ID {} and event ID {}", message.getUserId(), message.getEventId());
            bookingService.processBookingMessage(message);
            log.info("Successfully processed consumed message for user ID {} and event ID {}", message.getUserId(), message.getEventId());
        } catch (Exception e) {
            log.error("Failed to process consumed message from RabbitMQ on background worker", e);
            // Handling dead letters or compensating transactions can be added here
        } finally {
            MDC.remove("traceId");
        }
    }
}
