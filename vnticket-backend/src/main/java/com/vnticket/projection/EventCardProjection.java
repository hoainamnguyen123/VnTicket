package com.vnticket.projection;

import com.vnticket.enums.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface EventCardProjection {
    Long getId();
    String getName();
    String getImageUrl();
    LocalDateTime getStartTime();
    String getLocation();
    String getType();
    EventStatus getStatus();
    Boolean getIsSlider();
    Boolean getIsFeatured();
    BigDecimal getMinPrice();
}
