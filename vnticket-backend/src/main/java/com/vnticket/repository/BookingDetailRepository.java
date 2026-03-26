package com.vnticket.repository;

import com.vnticket.entity.BookingDetail;
import com.vnticket.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface BookingDetailRepository extends JpaRepository<BookingDetail, Long> {

    /**
     * Tính tổng số vé đang bị giữ bởi booking PENDING chưa hết hạn.
     * Dùng khi sync stock DB → Redis lúc khởi động.
     */
    @Query("SELECT COALESCE(SUM(bd.quantity), 0) FROM BookingDetail bd " +
           "WHERE bd.ticketType.id = :ticketTypeId " +
           "AND bd.booking.status = :status " +
           "AND bd.booking.bookingTime > :cutoffTime")
    int sumQuantityByTicketTypeAndBookingStatus(
            @Param("ticketTypeId") Long ticketTypeId,
            @Param("status") BookingStatus status,
            @Param("cutoffTime") LocalDateTime cutoffTime
    );
}
