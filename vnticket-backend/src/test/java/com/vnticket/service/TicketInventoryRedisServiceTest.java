package com.vnticket.service;

import com.vnticket.entity.Event;
import com.vnticket.entity.TicketType;
import com.vnticket.repository.BookingDetailRepository;
import com.vnticket.repository.TicketTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketInventoryRedisServiceTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOperations;
    @Mock TicketTypeRepository ticketTypeRepository;
    @Mock BookingDetailRepository bookingDetailRepository;

    private TicketInventoryRedisService service;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new TicketInventoryRedisService(
                redisTemplate, ticketTypeRepository, bookingDetailRepository);
    }

    @Test
    void initializesStockWithEventBasedTtl() {
        LocalDateTime eventTime = LocalDateTime.now().plusDays(2);

        service.initStock(9L, 25, eventTime);

        verify(valueOperations).set("ticket_stock:9", "25");
        verify(redisTemplate).expire(eq("ticket_stock:9"), any(Duration.class));
    }

    @Test
    void missingKeyStillRecoversFromPostgres() {
        Event event = Event.builder().startTime(LocalDateTime.now().plusDays(1)).build();
        TicketType type = TicketType.builder()
                .id(9L)
                .event(event)
                .remainingQuantity(12)
                .build();
        when(redisTemplate.hasKey("ticket_stock:9")).thenReturn(false);
        when(ticketTypeRepository.findById(9L)).thenReturn(Optional.of(type));
        when(bookingDetailRepository.sumQuantityByTicketTypeAndBookingStatus(eq(9L), any(), any()))
                .thenReturn(2);
        when(valueOperations.setIfAbsent("ticket_stock:9", "10")).thenReturn(true);
        when(valueOperations.get("ticket_stock:9")).thenReturn("10");

        assertThat(service.getStock(9L)).isEqualTo(10);
        verify(redisTemplate).expire(eq("ticket_stock:9"), any(Duration.class));
    }
}
