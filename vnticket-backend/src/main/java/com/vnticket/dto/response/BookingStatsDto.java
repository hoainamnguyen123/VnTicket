package com.vnticket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingStatsDto {
    private long totalBookings;
    private long paidBookings;
    private long pendingBookings;
    private long cancelledBookings;
    private long totalTicketsBooked; // pending + paid
    private long totalTicketsPaid;
    private BigDecimal totalRevenue;
}
