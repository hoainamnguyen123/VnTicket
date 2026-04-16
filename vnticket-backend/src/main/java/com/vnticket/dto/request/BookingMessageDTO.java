package com.vnticket.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingMessageDTO implements Serializable {
    private Long userId;
    private Long eventId;
    private Long ticketTypeId;
    private Integer quantity;
    private String traceId;
}
