package com.vnticket.service;

import com.vnticket.dto.BookingDto;
import com.vnticket.dto.request.BookingRequest;
import com.vnticket.dto.response.BookingStatsDto;
import com.vnticket.dto.TicketDto;

import java.util.List;

public interface BookingService {
    BookingStatsDto getStatistics();

    BookingStatsDto getEventStatistics(Long eventId);

    BookingDto bookTicket(Long userId, BookingRequest request);

    List<BookingDto> getMyBookings(Long userId);

    BookingDto cancelBooking(Long bookingId, Long userId);

    BookingDto mockPayBooking(Long bookingId, Long userId);

    List<TicketDto> getTicketsByBooking(Long bookingId, Long userId);

    void cancelExpiredBookings();

    void processVnPayPayment(Long bookingId);
}
