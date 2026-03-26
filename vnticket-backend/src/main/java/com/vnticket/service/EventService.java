package com.vnticket.service;

import com.vnticket.dto.EventDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.vnticket.entity.Event;
import com.vnticket.enums.EventStatus;

public interface EventService {
    Page<EventDTO> getApprovedEvents(String type, String search, Pageable pageable);

    Page<EventDTO> getAdminAllEvents(String type, String search, Pageable pageable);

    Page<EventDTO> getMyEvents(Long userId, Pageable pageable);

    EventDTO getEventById(Long id);

    EventDTO createAdminEvent(EventDTO EventDTO);

    EventDTO createMyEvent(Long userId, EventDTO EventDTO);

    EventDTO updateEvent(Long id, EventDTO EventDTO);

    EventDTO updateEventStatus(Long id, EventStatus status);

    void deleteEvent(Long id);
}
