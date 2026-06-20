package com.vnticket.dto;

import com.vnticket.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventCardDTO implements Serializable {
    private Long id;
    private String name;
    private String imageUrl;
    private LocalDateTime startTime;
    private String location;
    private String type;
    private EventStatus status;
    private Boolean isSlider;
    private Boolean isFeatured;
    private BigDecimal minPrice;
}
