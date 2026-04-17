package com.vnticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketTransferDTO {
    private Long id;
    private Long ticketId;
    private String oldTicketCode;
    private String newTicketCode;
    private String fromUsername;
    private String fromEmail;
    private String toUsername;
    private String toEmail;
    private String eventName;
    private String zoneName;
    private LocalDateTime transferredAt;
}
