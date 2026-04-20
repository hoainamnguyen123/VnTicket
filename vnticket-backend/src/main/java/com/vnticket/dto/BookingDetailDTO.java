package com.vnticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDetailDTO {
    private Long id;
    private Long ticketTypeId;
    private String zoneName;
    private Integer quantity;
    private BigDecimal price;
}
