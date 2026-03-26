package com.vnticket.dto;

import com.vnticket.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDTO {
    private Long id;
    private Long userId;
    private String username;
    private Long eventId;
    private String eventName;
    private LocalDateTime eventStartTime;
    private LocalDateTime bookingTime;
    private BookingStatus status;
    private BigDecimal totalAmount;
    private List<BookingDetailDTO> bookingDetails;
}
