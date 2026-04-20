package com.vnticket.dto;

import com.vnticket.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDTO {
    private Long id;
    private String ticketCode;
    private TicketStatus status;
    private String eventName;
    private String eventImageUrl;
    private String eventLocation;
    private String startTime;
    private String zoneName;
    private BigDecimal price;
}
