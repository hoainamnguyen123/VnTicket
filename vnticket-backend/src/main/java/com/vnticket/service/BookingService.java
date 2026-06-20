package com.vnticket.service;

import com.vnticket.dto.BookingDTO;
import com.vnticket.dto.request.BookingMessageDTO;
import com.vnticket.dto.request.BookingRequest;
import com.vnticket.dto.response.BookingStatsDTO;
import com.vnticket.dto.TicketDTO;
import com.vnticket.entity.Booking;

import java.util.List;
import java.util.Optional;

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

    void processBookingMessage(BookingMessageDTO message);

    List<BookingDTO> getPaidBookingsByEvent(Long eventId);

    Booking validateBookingForPayment(Long bookingId, Long userId);

    void confirmBookingPayment(Long bookingId);

    void freeCheckout(Long bookingId, Long userId);

    Optional<Booking> findBookingById(Long bookingId);
}
