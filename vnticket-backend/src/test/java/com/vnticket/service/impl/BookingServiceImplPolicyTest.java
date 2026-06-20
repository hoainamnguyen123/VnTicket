package com.vnticket.service.impl;

import com.vnticket.dto.request.BookingRequest;
import com.vnticket.entity.Event;
import com.vnticket.entity.User;
import com.vnticket.enums.BookingStatus;
import com.vnticket.enums.EventStatus;
import com.vnticket.exception.BadRequestException;
import com.vnticket.rabbitmq.BookingProducer;
import com.vnticket.repository.BookingDetailRepository;
import com.vnticket.repository.BookingRepository;
import com.vnticket.repository.EventRepository;
import com.vnticket.repository.TicketTypeRepository;
import com.vnticket.repository.UserRepository;
import com.vnticket.service.EmailService;
import com.vnticket.service.TicketInventoryRedisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplPolicyTest {

    @Mock BookingRepository bookingRepository;
    @Mock BookingDetailRepository bookingDetailRepository;
    @Mock EventRepository eventRepository;
    @Mock TicketTypeRepository ticketTypeRepository;
    @Mock UserRepository userRepository;
    @Mock TicketInventoryRedisService inventoryRedisService;
    @Mock BookingProducer bookingProducer;
    @Mock EmailService emailService;

    private BookingServiceImpl service;
    private BookingRequest request;
    private User user;

    @BeforeEach
    void setUp() {
        service = new BookingServiceImpl(
                bookingRepository, bookingDetailRepository, eventRepository,
                ticketTypeRepository, userRepository, inventoryRedisService,
                bookingProducer, emailService);
        ReflectionTestUtils.setField(service, "reservationTtlMinutes", 15);
        ReflectionTestUtils.setField(service, "singlePendingPerEvent", true);

        request = new BookingRequest();
        request.setEventId(10L);
        request.setTicketTypeId(20L);
        request.setQuantity(1);

        user = User.builder()
                .id(1L)
                .username("buyer")
                .email("buyer@example.com")
                .emailVerified(true)
                .build();
    }

    @Test
    void rejectsUnapprovedEventBeforeTouchingInventory() {
        Event event = Event.builder()
                .id(10L)
                .name("Pending event")
                .startTime(LocalDateTime.now().plusDays(1))
                .status(EventStatus.PENDING)
                .build();

        when(bookingRepository.existsByUserIdAndEventIdAndStatus(1L, 10L, BookingStatus.PENDING))
                .thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.bookTicket(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("approved");

        verify(inventoryRedisService, never()).decrementStock(20L, 1);
    }

    @Test
    void rejectsSecondPendingBookingWhenPolicyEnabled() {
        when(bookingRepository.existsByUserIdAndEventIdAndStatus(1L, 10L, BookingStatus.PENDING))
                .thenReturn(true);

        assertThatThrownBy(() -> service.bookTicket(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("pending booking");

        verify(userRepository, never()).findById(1L);
    }

    @Test
    void rejectsEventThatAlreadyStarted() {
        Event event = Event.builder()
                .id(10L)
                .name("Past event")
                .startTime(LocalDateTime.now().minusMinutes(1))
                .status(EventStatus.APPROVED)
                .build();
        when(bookingRepository.existsByUserIdAndEventIdAndStatus(1L, 10L, BookingStatus.PENDING))
                .thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.bookTicket(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("started");

        verify(inventoryRedisService, never()).decrementStock(20L, 1);
    }
}
