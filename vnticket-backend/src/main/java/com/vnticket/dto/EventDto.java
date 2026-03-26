package com.vnticket.dto;

import com.vnticket.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventDTO {
    private Long id;
    private String name;
    private String imageUrl;
    private List<String> additionalImages;
    private String description;
    private LocalDateTime startTime;
    private String location;
    private String type;
    private String organizerName;
    private List<TicketTypeDTO> ticketTypes;
    private EventStatus status;
    private Boolean isSlider;
    private Boolean isFeatured;
    private Long organizerId;
}
