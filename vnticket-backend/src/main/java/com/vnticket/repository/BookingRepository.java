package com.vnticket.repository;

import com.vnticket.entity.Booking;
import com.vnticket.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByBookingTimeDesc(Long userId);

    boolean existsByUserIdAndEventIdAndStatus(Long userId, Long eventId, BookingStatus status);

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
