package com.vnticket.service;

import com.vnticket.dto.BookingDTO;
import com.vnticket.dto.request.BookingRequest;
import com.vnticket.dto.response.BookingStatsDTO;
import com.vnticket.dto.TicketDTO;

import java.util.List;

public interface BookingService {
    BookingStatsDTO getStatistics();

    BookingStatsDTO getEventStatistics(Long eventId);

    BookingDTO bookTicket(Long userId, BookingRequest request);

    List<BookingDTO> getMyBookings(Long userId);

    BookingDTO cancelBooking(Long bookingId, Long userId);

    BookingDTO mockPayBooking(Long bookingId, Long userId);

    List<TicketDTO> getTicketsByBooking(Long bookingId, Long userId);

    void cancelExpiredBookings();

    void processVnPayPayment(Long bookingId);
}
