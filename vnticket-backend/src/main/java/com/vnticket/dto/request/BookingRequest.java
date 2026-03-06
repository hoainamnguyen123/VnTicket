package com.vnticket.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRequest {
    @NotNull
    private Long eventId;

    @NotNull
    private Long ticketTypeId;

    @NotNull
    @Min(1)
    private Integer quantity;
}
