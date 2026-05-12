package com.vnticket.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình RabbitMQ với Dead Letter Queue (DLQ).
 *
 * Luồng message:
 *   Producer → booking_exchange → booking_queue → Consumer xử lý
 *                                      │
 *                                 Nếu Consumer THROW exception
 *                                      │
 *                                      ▼
 *                  booking_exchange_dlq → booking_queue_dlq → DLQConsumer xử lý
 *                                                              (hoàn stock Redis + log)
 */
@Configuration
public class RabbitMQConfig {

    // ──── Main Queue ────
    public static final String QUEUE_BOOKING = "booking_queue";
    public static final String EXCHANGE_BOOKING = "booking_exchange";
    public static final String ROUTING_KEY_BOOKING = "booking_routing_key";

    // ──── Dead Letter Queue ────
    public static final String DLQ_QUEUE = "booking_queue_dlq";
    public static final String DLQ_EXCHANGE = "booking_exchange_dlq";
    public static final String DLQ_ROUTING_KEY = "booking_routing_key_dlq";

    // ═══════════════════ Main Queue Beans ═══════════════════

    /**
     * Queue chính xử lý booking.
     * Khi Consumer throw exception → RabbitMQ tự động chuyển message sang DLQ.
     *
     * x-dead-letter-exchange: Exchange sẽ nhận message bị reject
     * x-dead-letter-routing-key: Routing key để chuyển tới DLQ
     */
    @Bean
    public Queue bookingQueue() {
        return QueueBuilder.durable(QUEUE_BOOKING)
                .withArgument("x-dead-letter-exchange", DLQ_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public DirectExchange bookingExchange() {
        return new DirectExchange(EXCHANGE_BOOKING);
    }

    @Bean
    public Binding bookingBinding(Queue bookingQueue, DirectExchange bookingExchange) {
        return BindingBuilder.bind(bookingQueue).to(bookingExchange).with(ROUTING_KEY_BOOKING);
    }

    // ═══════════════════ Dead Letter Queue Beans ═══════════════════

    /**
     * Queue chứa message thất bại.
     * DLQConsumer sẽ lắng nghe queue này để hoàn lại stock vào Redis.
     */
    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ_QUEUE).build();
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(DLQ_EXCHANGE);
    }

    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue())
                .to(deadLetterExchange())
                .with(DLQ_ROUTING_KEY);
    }

    // ═══════════════════ Serialization ═══════════════════

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}
