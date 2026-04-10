package com.vnticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketTypeDTO implements Serializable {
    private Long id;
    private Long eventId;
    private String zoneName;
    private BigDecimal price;
    private Integer totalQuantity;
    private Integer remainingQuantity;
}
