package com.vnticket.service;

import com.vnticket.dto.EventDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.vnticket.entity.Event;
import com.vnticket.entity.EventStatus;

public interface EventService {
    Page<EventDto> getApprovedEvents(String type, String search, Pageable pageable);

    Page<EventDto> getAdminAllEvents(String type, String search, Pageable pageable);

    Page<EventDto> getMyEvents(Long userId, Pageable pageable);

    EventDto getEventById(Long id);

    EventDto createAdminEvent(EventDto eventDto);

    EventDto createMyEvent(Long userId, EventDto eventDto);

    EventDto updateEvent(Long id, EventDto eventDto);

    EventDto updateEventStatus(Long id, EventStatus status);

    void deleteEvent(Long id);
}
