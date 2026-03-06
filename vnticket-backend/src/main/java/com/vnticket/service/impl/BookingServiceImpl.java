package com.vnticket.service.impl;

import com.vnticket.dto.BookingDetailDto;
import com.vnticket.dto.BookingDto;
import com.vnticket.dto.request.BookingRequest;
import com.vnticket.dto.response.BookingStatsDto;
import com.vnticket.entity.*;
import com.vnticket.exception.BadRequestException;
import com.vnticket.exception.ResourceNotFoundException;
import com.vnticket.repository.BookingDetailRepository;
import com.vnticket.repository.BookingRepository;
import com.vnticket.repository.EventRepository;
import com.vnticket.repository.TicketTypeRepository;
import com.vnticket.repository.UserRepository;
import com.vnticket.service.BookingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final UserRepository userRepository;

    public BookingServiceImpl(BookingRepository bookingRepository, BookingDetailRepository bookingDetailRepository,
            EventRepository eventRepository, TicketTypeRepository ticketTypeRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.userRepository = userRepository;
    }

    @Override
    public BookingStatsDto getStatistics() {
        log.info("Fetching booking statistics for admin dashboard");

        long totalBookings = bookingRepository.count();
        long paidBookings = bookingRepository.countByStatus(BookingStatus.PAID);
        long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
        long cancelledBookings = bookingRepository.countByStatus(BookingStatus.CANCELLED);

        long totalTicketsBooked = bookingRepository
                .sumTicketsByStatuses(List.of(BookingStatus.PENDING, BookingStatus.PAID));
        long totalTicketsPaid = bookingRepository.sumTicketsByStatuses(List.of(BookingStatus.PAID));

        BigDecimal totalRevenue = bookingRepository.sumTotalAmountByStatus(BookingStatus.PAID);

        return BookingStatsDto.builder()
                .totalBookings(totalBookings)
                .paidBookings(paidBookings)
                .pendingBookings(pendingBookings)
                .cancelledBookings(cancelledBookings)
                .totalTicketsBooked(totalTicketsBooked)
                .totalTicketsPaid(totalTicketsPaid)
                .totalRevenue(totalRevenue)
                .build();
    }

    @Override
    public BookingStatsDto getEventStatistics(Long eventId) {
        log.info("Fetching booking statistics for Event ID: {}", eventId);

        if (!eventRepository.existsById(eventId)) {
            log.error("Failed to fetch statistics: Event not found with ID {}", eventId);
            throw new ResourceNotFoundException("Event not found");
        }

        long totalBookings = bookingRepository.countByEventId(eventId);
        long paidBookings = bookingRepository.countByEventIdAndStatus(eventId, BookingStatus.PAID);
        long pendingBookings = bookingRepository.countByEventIdAndStatus(eventId, BookingStatus.PENDING);
        long cancelledBookings = bookingRepository.countByEventIdAndStatus(eventId, BookingStatus.CANCELLED);

        long totalTicketsBooked = bookingRepository.sumTicketsByEventIdAndStatuses(eventId,
                List.of(BookingStatus.PENDING, BookingStatus.PAID));
        long totalTicketsPaid = bookingRepository.sumTicketsByEventIdAndStatuses(eventId, List.of(BookingStatus.PAID));

        BigDecimal totalRevenue = bookingRepository.sumTotalAmountByEventIdAndStatus(eventId, BookingStatus.PAID);

        return BookingStatsDto.builder()
                .totalBookings(totalBookings)
                .paidBookings(paidBookings)
                .pendingBookings(pendingBookings)
                .cancelledBookings(cancelledBookings)
                .totalTicketsBooked(totalTicketsBooked)
                .totalTicketsPaid(totalTicketsPaid)
                .totalRevenue(totalRevenue)
                .build();
    }

    @Override
    @Transactional
    public BookingDto bookTicket(Long userId, BookingRequest request) {
        log.info("Starting ticket booking process for User ID: {}, Event ID: {}, TicketType ID: {}, Quantity: {}",
                userId, request.getEventId(), request.getTicketTypeId(), request.getQuantity());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("Booking failed: User not found with ID: {}", userId);
                    return new ResourceNotFoundException("User not found");
                });

        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> {
                    log.error("Booking failed: Event not found with ID: {}", request.getEventId());
                    return new ResourceNotFoundException("Event not found");
                });

        TicketType ticketType = ticketTypeRepository.findById(request.getTicketTypeId())
                .orElseThrow(() -> {
                    log.error("Booking failed: TicketType not found with ID: {}", request.getTicketTypeId());
                    return new ResourceNotFoundException("TicketType not found");
                });

        if (!ticketType.getEvent().getId().equals(event.getId())) {
            log.warn("Booking failed: TicketType ID {} does not belong to Event ID {}", ticketType.getId(),
                    event.getId());
            throw new BadRequestException("Ticket type does not belong to this event");
        }

        // 1. Check quantity
        if (ticketType.getRemainingQuantity() < request.getQuantity()) {
            log.warn("Booking failed: Not enough tickets available. Requested: {}, Remaining: {}",
                    request.getQuantity(), ticketType.getRemainingQuantity());
            throw new BadRequestException("Not enough tickets available");
        }

        // 2. Decrement remaining quantity
        log.debug("Decrementing ticket quantity for TicketType ID: {} by {}", ticketType.getId(),
                request.getQuantity());
        ticketType.setRemainingQuantity(ticketType.getRemainingQuantity() - request.getQuantity());
        ticketTypeRepository.save(ticketType); // Optimistic locking (@Version) will trigger here if race condition

        // 3. Create Booking
        BigDecimal totalAmount = ticketType.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        log.debug("Calculated total amount for booking: {}", totalAmount);

        Booking booking = Booking.builder()
                .user(user)
                .event(event)
                .bookingTime(LocalDateTime.now())
                .status(BookingStatus.PENDING) // pending payment
                .totalAmount(totalAmount)
                .build();
        Booking savedBooking = bookingRepository.save(booking);

        // 4. Create BookingDetail
        BookingDetail detail = BookingDetail.builder()
                .booking(savedBooking)
                .ticketType(ticketType)
                .quantity(request.getQuantity())
                .price(ticketType.getPrice()) // save price at booking time
                .build();
        bookingDetailRepository.save(detail);

        savedBooking.setBookingDetails(List.of(detail));
        log.info("Successfully completed ticket booking. Booking ID: {} for User ID: {}", savedBooking.getId(), userId);
        return mapToDto(savedBooking);
    }

    @Override
    public List<BookingDto> getMyBookings(Long userId) {
        log.debug("Fetching all bookings for User ID: {}", userId);
        List<Booking> bookings = bookingRepository.findByUserIdOrderByBookingTimeDesc(userId);
        log.debug("Found {} bookings for User ID: {}", bookings.size(), userId);
        return bookings.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingDto cancelBooking(Long bookingId, Long userId) {
        log.info("Starting cancellation process for Booking ID: {}, Requested by User ID: {}", bookingId, userId);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> {
                    log.error("Cancellation failed: Booking not found with ID: {}", bookingId);
                    return new ResourceNotFoundException("Booking not found");
                });

        if (!booking.getUser().getId().equals(userId)) {
            log.warn("Cancellation failed: User ID {} attempted to cancel Booking ID {} owned by User ID {}",
                    userId, bookingId, booking.getUser().getId());
            throw new BadRequestException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == BookingStatus.PAID) {
            log.warn("Cancellation failed: Booking ID {} is already PAID and cannot be cancelled", bookingId);
            throw new BadRequestException("Cannot cancel paid bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            log.warn("Cancellation failed: Booking ID {} is already CANCELLED", bookingId);
            throw new BadRequestException("Booking is already cancelled");
        }

        log.debug("Updating booking status to CANCELLED for Booking ID: {}", bookingId);
        booking.setStatus(BookingStatus.CANCELLED);

        // Restore ticket quantities
        for (BookingDetail detail : booking.getBookingDetails()) {
            TicketType ticketType = detail.getTicketType();
            log.debug("Restoring {} tickets for TicketType ID: {}", detail.getQuantity(), ticketType.getId());
            ticketType.setRemainingQuantity(ticketType.getRemainingQuantity() + detail.getQuantity());
            ticketTypeRepository.save(ticketType);
        }

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Successfully cancelled Booking ID: {} for User ID: {}", bookingId, userId);
        return mapToDto(savedBooking);
    }

    private BookingDto mapToDto(Booking booking) {
        List<BookingDetailDto> detailDtos = booking.getBookingDetails().stream()
                .map(detail -> BookingDetailDto.builder()
                        .id(detail.getId())
                        .ticketTypeId(detail.getTicketType().getId())
                        .zoneName(detail.getTicketType().getZoneName())
                        .quantity(detail.getQuantity())
                        .price(detail.getPrice())
                        .build())
                .collect(Collectors.toList());

        return BookingDto.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .username(booking.getUser().getUsername())
                .eventId(booking.getEvent().getId())
                .eventName(booking.getEvent().getName())
                .bookingTime(booking.getBookingTime())
                .status(booking.getStatus())
                .totalAmount(booking.getTotalAmount())
                .bookingDetails(detailDtos)
                .build();
    }
}
