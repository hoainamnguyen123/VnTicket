package com.vnticket.repository;

import com.vnticket.entity.Booking;
import com.vnticket.enums.BookingStatus;
import com.vnticket.projection.BookingStatsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    String SYSTEM_STATS_QUERY = """
            SELECT
              CAST(COUNT(*) AS bigint) AS "totalBookings",
              CAST(COUNT(*) FILTER (WHERE b.status = 'PAID') AS bigint) AS "paidBookings",
              CAST(COUNT(*) FILTER (WHERE b.status = 'PENDING') AS bigint) AS "pendingBookings",
              CAST(COUNT(*) FILTER (WHERE b.status = 'CANCELLED') AS bigint) AS "cancelledBookings",
              CAST(COALESCE((
                SELECT SUM(bd.quantity)
                FROM booking_details bd
                JOIN bookings booking ON booking.id = bd.booking_id
                WHERE booking.status IN ('PENDING', 'PAID') AND booking.total_amount > 0
              ), 0) AS bigint) AS "totalTicketsBooked",
              CAST(COALESCE((
                SELECT SUM(bd.quantity)
                FROM booking_details bd
                JOIN bookings booking ON booking.id = bd.booking_id
                WHERE booking.status = 'PAID' AND booking.total_amount > 0
              ), 0) AS bigint) AS "totalTicketsPaid",
              COALESCE(SUM(b.total_amount) FILTER (WHERE b.status = 'PAID'), 0) AS "totalRevenue"
            FROM bookings b
            """;

    String EVENT_STATS_QUERY = """
            SELECT
              CAST(COUNT(*) AS bigint) AS "totalBookings",
              CAST(COUNT(*) FILTER (WHERE b.status = 'PAID') AS bigint) AS "paidBookings",
              CAST(COUNT(*) FILTER (WHERE b.status = 'PENDING') AS bigint) AS "pendingBookings",
              CAST(COUNT(*) FILTER (WHERE b.status = 'CANCELLED') AS bigint) AS "cancelledBookings",
              CAST(COALESCE((
                SELECT SUM(bd.quantity)
                FROM booking_details bd
                JOIN bookings booking ON booking.id = bd.booking_id
                WHERE booking.event_id = :eventId
                  AND booking.status IN ('PENDING', 'PAID')
                  AND booking.total_amount > 0
              ), 0) AS bigint) AS "totalTicketsBooked",
              CAST(COALESCE((
                SELECT SUM(bd.quantity)
                FROM booking_details bd
                JOIN bookings booking ON booking.id = bd.booking_id
                WHERE booking.event_id = :eventId
                  AND booking.status = 'PAID'
                  AND booking.total_amount > 0
              ), 0) AS bigint) AS "totalTicketsPaid",
              COALESCE(SUM(b.total_amount) FILTER (WHERE b.status = 'PAID'), 0) AS "totalRevenue"
            FROM bookings b
            WHERE b.event_id = :eventId
            """;

    @Query(value = SYSTEM_STATS_QUERY, nativeQuery = true)
    BookingStatsProjection getSystemStatistics();

    @Query(value = EVENT_STATS_QUERY, nativeQuery = true)
    BookingStatsProjection getEventStatistics(@Param("eventId") Long eventId);

    List<Booking> findByUserIdOrderByBookingTimeDesc(Long userId);

    boolean existsByUserIdAndEventIdAndStatus(Long userId, Long eventId, BookingStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<Booking> findByStatusAndBookingTimeBefore(BookingStatus status, LocalDateTime time);

    long countByStatus(BookingStatus status);

    long countByEventIdAndStatus(Long eventId, BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.event.id = :eventId")
    long countByEventId(@Param("eventId") Long eventId);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.status = :status")
    BigDecimal sumTotalAmountByStatus(@Param("status") BookingStatus status);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.event.id = :eventId AND b.status = :status")
    BigDecimal sumTotalAmountByEventIdAndStatus(@Param("eventId") Long eventId, @Param("status") BookingStatus status);

    @Query("SELECT COALESCE(SUM(bd.quantity), 0) FROM BookingDetail bd JOIN bd.booking b WHERE b.status IN :statuses AND b.totalAmount > 0")
    long sumTicketsByStatuses(@Param("statuses") List<BookingStatus> statuses);

    @Query("SELECT COALESCE(SUM(bd.quantity), 0) FROM BookingDetail bd JOIN bd.booking b WHERE b.event.id = :eventId AND b.status IN :statuses AND b.totalAmount > 0")
    long sumTicketsByEventIdAndStatuses(@Param("eventId") Long eventId,
            @Param("statuses") List<BookingStatus> statuses);

    List<Booking> findByEventIdAndStatusOrderByBookingTimeDesc(Long eventId, BookingStatus status);
}
