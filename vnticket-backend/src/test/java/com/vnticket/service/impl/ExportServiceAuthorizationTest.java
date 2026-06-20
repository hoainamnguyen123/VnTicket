package com.vnticket.service.impl;

import com.vnticket.entity.Event;
import com.vnticket.entity.User;
import com.vnticket.enums.EventStatus;
import com.vnticket.exception.BadRequestException;
import com.vnticket.repository.EventRepository;
import com.vnticket.service.BookingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExportServiceAuthorizationTest {

    @Mock BookingService bookingService;
    @Mock EventRepository eventRepository;

    @Test
    void organizerCannotExportAnotherUsersEvent() {
        Event event = Event.builder()
                .id(50L)
                .name("Private event")
                .organizer(User.builder().id(1L).build())
                .status(EventStatus.APPROVED)
                .startTime(LocalDateTime.now().plusDays(1))
                .build();
        when(eventRepository.findById(50L)).thenReturn(Optional.of(event));
        ExportServiceImpl service = new ExportServiceImpl(bookingService, eventRepository);

        assertThatThrownBy(() -> service.exportBookingsToPdf(50L, 2L, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("permission");

        verify(bookingService, never()).getPaidBookingsByEvent(50L);
    }
}
