package com.vnticket.service.impl;

import com.vnticket.entity.Booking;
import com.vnticket.entity.BookingDetail;
import com.vnticket.entity.Event;
import com.vnticket.entity.TicketType;
import com.vnticket.entity.User;
import com.vnticket.enums.BookingStatus;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingPaymentIdempotencyTest {

    @Mock BookingRepository bookingRepository;
    @Mock BookingDetailRepository bookingDetailRepository;
    @Mock EventRepository eventRepository;
    @Mock TicketTypeRepository ticketTypeRepository;
    @Mock UserRepository userRepository;
    @Mock TicketInventoryRedisService inventoryRedisService;
    @Mock BookingProducer bookingProducer;
    @Mock EmailService emailService;

    private BookingServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new BookingServiceImpl(
                bookingRepository, bookingDetailRepository, eventRepository,
                ticketTypeRepository, userRepository, inventoryRedisService,
                bookingProducer, emailService);
    }

    @Test
    void confirmsPendingBookingExactlyOnce() {
        TicketType ticketType = TicketType.builder()
                .id(7L)
                .remainingQuantity(10)
                .totalQuantity(10)
                .build();
        Booking booking = booking(BookingStatus.PENDING);
        BookingDetail detail = BookingDetail.builder()
                .booking(booking)
                .ticketType(ticketType)
                .quantity(2)
                .price(new BigDecimal("100000"))
                .build();
        booking.setBookingDetails(List.of(detail));
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(booking)).thenReturn(booking);

        service.confirmBookingPayment(100L);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.PAID);
        assertThat(ticketType.getRemainingQuantity()).isEqualTo(8);
        verify(inventoryRedisService).removeReservation(100L, 7L, 2);
        verify(ticketTypeRepository).save(ticketType);
        verify(emailService).sendTicketConfirmationEmail(booking);
    }

    @Test
    void duplicateCallbackDoesNotDecrementInventoryAgain() {
        Booking booking = booking(BookingStatus.PAID);
        when(bookingRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(booking));

        service.confirmBookingPayment(100L);

        verify(bookingRepository, never()).save(booking);
        verify(ticketTypeRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(emailService, never()).sendTicketConfirmationEmail(booking);
    }

    private Booking booking(BookingStatus status) {
        Event event = Event.builder()
                .id(5L)
                .name("Event")
                .startTime(LocalDateTime.now().plusDays(1))
                .build();
        return Booking.builder()
                .id(100L)
                .user(User.builder().id(1L).username("buyer").email("buyer@example.com").build())
                .event(event)
                .bookingTime(LocalDateTime.now())
                .status(status)
                .totalAmount(new BigDecimal("200000"))
                .bookingDetails(List.of())
                .build();
    }
}
