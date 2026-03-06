package com.vnticket.dto;

import com.vnticket.entity.EventStatus;
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
public class EventDto {
    private Long id;
    private String name;
    private String imageUrl;
    private List<String> additionalImages;
    private String description;
    private LocalDateTime startTime;
    private String location;
    private String type;
    private String organizerName;
    private List<TicketTypeDto> ticketTypes;
    private EventStatus status;
    private Long organizerId;
}
