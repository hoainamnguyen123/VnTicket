package com.vnticket.service.impl;

import com.vnticket.dto.BookingDetailDTO;
import com.vnticket.dto.BookingDTO;
import com.vnticket.dto.request.BookingRequest;
import com.vnticket.dto.response.BookingStatsDTO;
import com.vnticket.dto.TicketDTO;
import com.vnticket.entity.*;
import com.vnticket.enums.BookingStatus;
import com.vnticket.enums.TicketStatus;
import com.vnticket.exception.BadRequestException;
import com.vnticket.exception.ResourceNotFoundException;
import com.vnticket.repository.BookingDetailRepository;
import com.vnticket.repository.BookingRepository;
import com.vnticket.repository.EventRepository;
import com.vnticket.repository.TicketTypeRepository;
import com.vnticket.repository.UserRepository;
import com.vnticket.service.BookingService;
import com.vnticket.service.TicketInventoryRedisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final UserRepository userRepository;
    private final TicketInventoryRedisService inventoryRedisService;

    @Value("${app.reservation.ttlMinutes:15}")
    private int reservationTtlMinutes;

    public BookingServiceImpl(BookingRepository bookingRepository,
                              BookingDetailRepository bookingDetailRepository,
                              EventRepository eventRepository,
                              TicketTypeRepository ticketTypeRepository,
                              UserRepository userRepository,
                              TicketInventoryRedisService inventoryRedisService) {
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.userRepository = userRepository;
        this.inventoryRedisService = inventoryRedisService;
    }

    // ──────────────────── Statistics (unchanged) ────────────────────

    @Override
    public BookingStatsDTO getStatistics() {
        log.info("Fetching booking statistics for admin dashboard");

        long totalBookings = bookingRepository.count();
        long paidBookings = bookingRepository.countByStatus(BookingStatus.PAID);
        long pendingBookings = bookingRepository.countByStatus(BookingStatus.PENDING);
        long cancelledBookings = bookingRepository.countByStatus(BookingStatus.CANCELLED);

        long totalTicketsBooked = bookingRepository
                .sumTicketsByStatuses(List.of(BookingStatus.PENDING, BookingStatus.PAID));
        long totalTicketsPaid = bookingRepository.sumTicketsByStatuses(List.of(BookingStatus.PAID));

        BigDecimal totalRevenue = bookingRepository.sumTotalAmountByStatus(BookingStatus.PAID);

        return BookingStatsDTO.builder()
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
    public BookingStatsDTO getEventStatistics(Long eventId) {
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
        long totalTicketsPaid = bookingRepository.sumTicketsByEventIdAndStatuses(eventId,
                List.of(BookingStatus.PAID));

        BigDecimal totalRevenue = bookingRepository.sumTotalAmountByEventIdAndStatus(eventId, BookingStatus.PAID);

        return BookingStatsDTO.builder()
                .totalBookings(totalBookings)
                .paidBookings(paidBookings)
                .pendingBookings(pendingBookings)
                .cancelledBookings(cancelledBookings)
                .totalTicketsBooked(totalTicketsBooked)
                .totalTicketsPaid(totalTicketsPaid)
                .totalRevenue(totalRevenue)
                .build();
    }

    // ──────────────────── My Bookings ────────────────────

    @Override
    public List<BookingDTO> getMyBookings(Long userId) {
        log.debug("Fetching all bookings for User ID: {}", userId);
        List<Booking> bookings = bookingRepository.findByUserIdOrderByBookingTimeDesc(userId);
        return bookings.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    // ──────────────────── Book Ticket (Redis-powered) ────────────────────

    @Override
    @Transactional
    public BookingDTO bookTicket(Long userId, BookingRequest request) {
        log.info("Starting ticket booking: userId={}, eventId={}, ticketTypeId={}, quantity={}",
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
            throw new BadRequestException("Ticket type does not belong to this event");
        }

        // ═══ Step 1: Atomic decrement stock trên Redis ═══
        boolean decremented = inventoryRedisService.decrementStock(
                ticketType.getId(), request.getQuantity());
        if (!decremented) {
            log.warn("Booking failed: Not enough tickets (Redis). TicketType={}", ticketType.getId());
            throw new BadRequestException("Not enough tickets available");
        }

        try {
            // ═══ Step 2: Tạo Booking trong DB ═══
            BigDecimal totalAmount = ticketType.getPrice()
                    .multiply(BigDecimal.valueOf(request.getQuantity()));

            Booking booking = Booking.builder()
                    .user(user)
                    .event(event)
                    .bookingTime(LocalDateTime.now())
                    .status(BookingStatus.PENDING)
                    .totalAmount(totalAmount)
                    .build();
            Booking savedBooking = bookingRepository.save(booking);

            // ═══ Step 3: Tạo BookingDetail ═══
            BookingDetail detail = BookingDetail.builder()
                    .booking(savedBooking)
                    .ticketType(ticketType)
                    .quantity(request.getQuantity())
                    .price(ticketType.getPrice())
                    .build();

            // ═══ Step 4: Generate Electronic Tickets ═══
            List<Ticket> tickets = new ArrayList<>();
            for (int i = 0; i < request.getQuantity(); i++) {
                String code = "VNT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                tickets.add(Ticket.builder()
                        .ticketCode(code)
                        .bookingDetail(detail)
                        .status(TicketStatus.VALID)
                        .build());
            }
            detail.setTickets(tickets);
            bookingDetailRepository.save(detail);

            // ═══ Step 5: Tạo reservation trong Redis ZSET ═══
            long expireTimeMs = System.currentTimeMillis()
                    + (long) reservationTtlMinutes * 60 * 1000;
            inventoryRedisService.addReservation(
                    savedBooking.getId(), ticketType.getId(),
                    request.getQuantity(), expireTimeMs);

            savedBooking.setBookingDetails(List.of(detail));
            log.info("Booking created successfully: bookingId={}, userId={}", savedBooking.getId(), userId);
            return mapToDto(savedBooking);

        } catch (Exception e) {
            // ❗ Rollback Redis stock nếu DB fail
            log.error("DB save failed after Redis decrement. Rolling back stock. Error: {}", e.getMessage());
            inventoryRedisService.incrementStock(ticketType.getId(), request.getQuantity());
            throw e;
        }
    }

    // ──────────────────── Cancel Booking ────────────────────

    @Override
    @Transactional
    public BookingDTO cancelBooking(Long bookingId, Long userId) {
        log.info("Cancelling booking: bookingId={}, userId={}", bookingId, userId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only cancel your own bookings");
        }
        if (booking.getStatus() == BookingStatus.PAID) {
            throw new BadRequestException("Cannot cancel paid bookings");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        for (BookingDetail detail : booking.getBookingDetails()) {
            TicketType ticketType = detail.getTicketType();
            int quantity = detail.getQuantity();

            // Hoàn vé: Redis + DB
            inventoryRedisService.incrementStock(ticketType.getId(), quantity);
            inventoryRedisService.removeReservation(bookingId, ticketType.getId(), quantity);

            ticketType.setRemainingQuantity(ticketType.getRemainingQuantity() + quantity);
            ticketTypeRepository.save(ticketType);

            // Cancel electronic tickets
            if (detail.getTickets() != null) {
                detail.getTickets().forEach(t -> t.setStatus(TicketStatus.CANCELLED));
            }
        }

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Booking {} cancelled successfully by user {}", bookingId, userId);
        return mapToDto(savedBooking);
    }

    // ──────────────────── Mock Payment ────────────────────

    @Override
    @Transactional
    public BookingDTO mockPayBooking(Long bookingId, Long userId) {
        log.info("Mock payment: bookingId={}, userId={}", bookingId, userId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only pay for your own bookings");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Booking is not in PENDING state");
        }

        // Check expiration
        if (Duration.between(booking.getBookingTime(), LocalDateTime.now()).toMinutes() >= reservationTtlMinutes) {
            log.warn("Mock payment rejected: Booking {} expired", bookingId);
            handleExpiredPaymentAttempt(booking);
            throw new BadRequestException("Thời gian thanh toán đã hết hạn. Đơn hàng đã tự động bị hủy.");
        }

        // ═══ Thanh toán thành công ═══
        confirmPayment(booking);

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Mock payment successful: bookingId={}", bookingId);
        return mapToDto(savedBooking);
    }

    // ──────────────────── VNPay Payment ────────────────────

    @Override
    @Transactional
    public void processVnPayPayment(Long bookingId) {
        log.info("Processing VNPay payment: bookingId={}", bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            log.warn("Booking {} is not PENDING, skipping VNPay processing", bookingId);
            return;
        }

        confirmPayment(booking);
        bookingRepository.save(booking);
        log.info("VNPay payment confirmed: bookingId={}", bookingId);
    }

    // ──────────────────── Expired Bookings (Safety Net) ────────────────────

    @Override
    @Transactional
    public void cancelExpiredBookings() {
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(reservationTtlMinutes);
        List<Booking> expiredBookings = bookingRepository.findByStatusAndBookingTimeBefore(
                BookingStatus.PENDING, expiryTime);

        if (expiredBookings.isEmpty()) {
            return;
        }

        log.info("[Safety Net] Found {} expired PENDING bookings", expiredBookings.size());
        for (Booking booking : expiredBookings) {
            booking.setStatus(BookingStatus.CANCELLED);

            for (BookingDetail detail : booking.getBookingDetails()) {
                TicketType ticketType = detail.getTicketType();
                int quantity = detail.getQuantity();

                // Hoàn vé: Redis + DB
                inventoryRedisService.incrementStock(ticketType.getId(), quantity);
                ticketType.setRemainingQuantity(ticketType.getRemainingQuantity() + quantity);
                ticketTypeRepository.save(ticketType);

                if (detail.getTickets() != null) {
                    detail.getTickets().forEach(t -> t.setStatus(TicketStatus.CANCELLED));
                }
            }
        }
        bookingRepository.saveAll(expiredBookings);
    }

    // ──────────────────── Get Tickets ────────────────────

    @Override
    public List<TicketDTO> getTicketsByBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new BadRequestException("You cannot view these tickets");
        }

        return booking.getBookingDetails().stream()
                .flatMap(detail -> detail.getTickets() != null
                        ? detail.getTickets().stream()
                        : Stream.empty())
                .map(this::mapTicketToDto)
                .collect(Collectors.toList());
    }

    // ──────────────────── Private Helpers ────────────────────

    /**
     * Xử lý thanh toán thành công: xóa reservation, sync DB.
     */
    private void confirmPayment(Booking booking) {
        booking.setStatus(BookingStatus.PAID);

        for (BookingDetail detail : booking.getBookingDetails()) {
            TicketType ticketType = detail.getTicketType();
            int quantity = detail.getQuantity();

            // Xóa reservation (vé đã bán chính thức)
            inventoryRedisService.removeReservation(booking.getId(), ticketType.getId(), quantity);

            // Sync DB: trừ remainingQuantity chính thức
            ticketType.setRemainingQuantity(ticketType.getRemainingQuantity() - quantity);
            ticketTypeRepository.save(ticketType);
        }
    }

    /**
     * Xử lý khi thanh toán quá hạn: cancel + hoàn vé Redis + sync DB.
     */
    private void handleExpiredPaymentAttempt(Booking booking) {
        booking.setStatus(BookingStatus.CANCELLED);

        for (BookingDetail detail : booking.getBookingDetails()) {
            TicketType ticketType = detail.getTicketType();
            int quantity = detail.getQuantity();

            inventoryRedisService.incrementStock(ticketType.getId(), quantity);
            inventoryRedisService.removeReservation(booking.getId(), ticketType.getId(), quantity);

            ticketType.setRemainingQuantity(ticketType.getRemainingQuantity() + quantity);
            ticketTypeRepository.save(ticketType);

            if (detail.getTickets() != null) {
                detail.getTickets().forEach(t -> t.setStatus(TicketStatus.CANCELLED));
            }
        }
        bookingRepository.save(booking);
    }

    private BookingDTO mapToDto(Booking booking) {
        List<BookingDetailDTO> detailDtos = booking.getBookingDetails().stream()
                .map(detail -> BookingDetailDTO.builder()
                        .id(detail.getId())
                        .ticketTypeId(detail.getTicketType().getId())
                        .zoneName(detail.getTicketType().getZoneName())
                        .quantity(detail.getQuantity())
                        .price(detail.getPrice())
                        .build())
                .collect(Collectors.toList());

        return BookingDTO.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .username(booking.getUser().getUsername())
                .eventId(booking.getEvent().getId())
                .eventName(booking.getEvent().getName())
                .eventStartTime(booking.getEvent().getStartTime())
                .bookingTime(booking.getBookingTime())
                .status(booking.getStatus())
                .totalAmount(booking.getTotalAmount())
                .bookingDetails(detailDtos)
                .build();
    }

    private TicketDTO mapTicketToDto(Ticket ticket) {
        Event event = ticket.getBookingDetail().getTicketType().getEvent();
        return TicketDTO.builder()
                .id(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .status(ticket.getStatus())
                .eventName(event.getName())
                .eventImageUrl(event.getImageUrl())
                .eventLocation(event.getLocation())
                .startTime(event.getStartTime() != null ? event.getStartTime().toString() : null)
                .zoneName(ticket.getBookingDetail().getTicketType().getZoneName())
                .price(ticket.getBookingDetail().getPrice())
                .build();
    }
}
