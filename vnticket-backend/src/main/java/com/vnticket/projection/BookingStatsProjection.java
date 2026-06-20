package com.vnticket.projection;

import java.math.BigDecimal;

public interface BookingStatsProjection {
    Long getTotalBookings();
    Long getPaidBookings();
    Long getPendingBookings();
    Long getCancelledBookings();
    Long getTotalTicketsBooked();
    Long getTotalTicketsPaid();
    BigDecimal getTotalRevenue();
}
