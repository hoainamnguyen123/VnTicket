package com.vnticket.service.impl;

import com.vnticket.dto.BookingDTO;
import com.vnticket.dto.BookingDetailDTO;
import com.vnticket.entity.Event;
import com.vnticket.entity.User;
import com.vnticket.enums.EventStatus;
import com.vnticket.repository.EventRepository;
import com.vnticket.service.BookingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExportServiceRenderTest {

    @Mock BookingService bookingService;
    @Mock EventRepository eventRepository;

    @Test
    void rendersPdfAndExcelForEventOwner() throws Exception {
        Event event = Event.builder()
                .id(50L)
                .name("VNTicket Test Event")
                .organizer(User.builder().id(1L).build())
                .status(EventStatus.APPROVED)
                .startTime(LocalDateTime.now().plusDays(1))
                .build();
        BookingDTO booking = BookingDTO.builder()
                .id(99L)
                .username("buyer")
                .email("buyer@example.com")
                .bookingTime(LocalDateTime.now())
                .totalAmount(new BigDecimal("250000"))
                .bookingDetails(List.of(BookingDetailDTO.builder()
                        .zoneName("VIP")
                        .quantity(2)
                        .build()))
                .build();
        when(eventRepository.findById(50L)).thenReturn(Optional.of(event));
        when(bookingService.getPaidBookingsByEvent(50L)).thenReturn(List.of(booking));

        ExportServiceImpl service = new ExportServiceImpl(bookingService, eventRepository);
        byte[] pdf = service.exportBookingsToPdf(50L, 1L, false);
        byte[] excel = service.exportBookingsToExcel(50L, 1L, false);

        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
        assertThat(excel[0]).isEqualTo((byte) 'P');
        assertThat(excel[1]).isEqualTo((byte) 'K');
    }
}
