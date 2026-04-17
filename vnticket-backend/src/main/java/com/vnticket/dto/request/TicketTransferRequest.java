package com.vnticket.dto.request;

import lombok.Data;

@Data
public class TicketTransferRequest {
    private Long ticketId;
    private String recipientEmail;
}
