package com.vnticket.rabbitmq;

import com.vnticket.config.RabbitMQConfig;
import com.vnticket.dto.request.BookingMessageDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class BookingProducer {

    private final RabbitTemplate rabbitTemplate;

    public BookingProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendBookingMessage(BookingMessageDTO bookingMessageDTO) {
        log.info("Publishing booking request to RabbitMQ for user ID {}", bookingMessageDTO.getUserId());
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_BOOKING, RabbitMQConfig.ROUTING_KEY_BOOKING, bookingMessageDTO);
        log.info("Successfully published booking request to RabbitMQ");
    }
}
