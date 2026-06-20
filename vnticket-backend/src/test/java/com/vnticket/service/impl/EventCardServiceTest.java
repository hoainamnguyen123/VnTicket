package com.vnticket.service.impl;

import com.vnticket.dto.EventCardDTO;
import com.vnticket.enums.EventStatus;
import com.vnticket.projection.EventCardProjection;
import com.vnticket.repository.BookingDetailRepository;
import com.vnticket.repository.EventRepository;
import com.vnticket.repository.TicketTypeRepository;
import com.vnticket.service.TicketInventoryRedisService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventCardServiceTest {

    @Mock EventRepository eventRepository;
    @Mock TicketTypeRepository ticketTypeRepository;
    @Mock TicketInventoryRedisService inventoryRedisService;
    @Mock BookingDetailRepository bookingDetailRepository;
    @Mock EventCardProjection projection;

    @Test
    void returnsLightweightCardsWithMinimumPrice() {
        PageRequest pageable = PageRequest.of(0, 10);
        when(projection.getId()).thenReturn(11L);
        when(projection.getName()).thenReturn("Concert");
        when(projection.getStartTime()).thenReturn(LocalDateTime.now().plusDays(2));
        when(projection.getStatus()).thenReturn(EventStatus.APPROVED);
        when(projection.getMinPrice()).thenReturn(new BigDecimal("150000"));
        when(eventRepository.findCardByStatus(EventStatus.APPROVED, pageable))
                .thenReturn(new PageImpl<>(List.of(projection), pageable, 1));

        EventServiceImpl service = new EventServiceImpl(
                eventRepository, ticketTypeRepository, inventoryRedisService, bookingDetailRepository);

        Page<EventCardDTO> result = service.getApprovedEventCards(null, null, null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getMinPrice()).isEqualByComparingTo("150000");
    }
}
