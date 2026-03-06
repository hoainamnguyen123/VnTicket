package com.vnticket.service.impl;

import com.vnticket.dto.EventDto;
import com.vnticket.dto.TicketTypeDto;
import com.vnticket.entity.Event;
import com.vnticket.entity.TicketType;
import com.vnticket.exception.ResourceNotFoundException;
import com.vnticket.repository.EventRepository;
import com.vnticket.repository.TicketTypeRepository;
import com.vnticket.service.EventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;

    public EventServiceImpl(EventRepository eventRepository, TicketTypeRepository ticketTypeRepository) {
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
    }

    @Override
    public Page<EventDto> getApprovedEvents(String type, String search, Pageable pageable) {
        log.debug("Executing getApprovedEvents with type: {}, search: {}", type, search);
        Page<Event> events;

        if (search != null && !search.isEmpty()) {
            events = eventRepository.searchEventsByStatus(search, com.vnticket.entity.EventStatus.APPROVED, pageable);
        } else if (type != null && !type.isEmpty()) {
            events = eventRepository.findByTypeContainingIgnoreCaseAndStatus(type,
                    com.vnticket.entity.EventStatus.APPROVED, pageable);
        } else {
            events = eventRepository.findByStatus(com.vnticket.entity.EventStatus.APPROVED, pageable);
        }

        log.debug("Found {} approved events", events.getTotalElements());
        return events.map(this::mapToDto);
    }

    @Override
    public Page<EventDto> getAdminAllEvents(String type, String search, Pageable pageable) {
        log.debug("Executing getAdminAllEvents with type: {}, search: {}", type, search);
        Page<Event> events;
        if (search != null && !search.isEmpty()) {
            events = eventRepository.searchEvents(search, pageable);
        } else if (type != null && !type.isEmpty()) {
            events = eventRepository.findByTypeContainingIgnoreCase(type, pageable);
        } else {
            events = eventRepository.findAll(pageable);
        }
        return events.map(this::mapToDto);
    }

    @Override
    public Page<EventDto> getMyEvents(Long userId, Pageable pageable) {
        log.debug("Fetching events organized by user ID: {}", userId);
        List<Event> events = eventRepository.findByOrganizerId(userId);

        // Manual pagination or custom query for page. For simplicity with existing list
        // interface logic:
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), events.size());
        List<EventDto> pagedEvents = events.subList(start, end).stream().map(this::mapToDto)
                .collect(Collectors.toList());
        return new org.springframework.data.domain.PageImpl<>(pagedEvents, pageable, events.size());
    }

    @Override
    public EventDto getEventById(Long id) {
        log.debug("Fetching event with ID: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Event not found with ID: {}", id);
                    return new ResourceNotFoundException("Event not found with id: " + id);
                });
        return mapToDto(event);
    }

    @Override
    @Transactional
    public EventDto updateEvent(Long id, EventDto eventDto) {
        log.info("Updating event ID: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Failed to update: Event not found with ID: {}", id);
                    return new ResourceNotFoundException("Event not found with id: " + id);
                });

        // Update fields
        event.setName(eventDto.getName());
        event.setImageUrl(eventDto.getImageUrl());
        event.setAdditionalImages(eventDto.getAdditionalImages());
        event.setDescription(eventDto.getDescription());
        event.setStartTime(eventDto.getStartTime());
        event.setLocation(eventDto.getLocation());
        event.setType(eventDto.getType());
        event.setOrganizerName(eventDto.getOrganizerName());
        // Only update status if provided (admin override context)
        if (eventDto.getStatus() != null) {
            event.setStatus(eventDto.getStatus());
        }

        Event updatedEvent = eventRepository.save(event);
        log.info("Successfully updated event ID: {}", id);
        return mapToDto(updatedEvent);
    }

    @Override
    @Transactional
    public EventDto updateEventStatus(Long id, com.vnticket.entity.EventStatus status) {
        log.info("Updating status for event ID: {} to {}", id, status);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        event.setStatus(status);
        Event updatedEvent = eventRepository.save(event);
        return mapToDto(updatedEvent);
    }

    @Override
    @Transactional
    public EventDto createAdminEvent(EventDto eventDto) {
        log.info("Creating new admin event (auto-approved): {}", eventDto.getName());
        Event event = mapToEntity(eventDto);
        event.setStatus(com.vnticket.entity.EventStatus.APPROVED);

        Event savedEvent = eventRepository.save(event);
        saveTicketTypes(eventDto, savedEvent);
        return mapToDto(savedEvent);
    }

    @Override
    @Transactional
    public EventDto createMyEvent(Long userId, EventDto eventDto) {
        log.info("Creating user event (pending approval) for user: {}", userId);
        Event event = mapToEntity(eventDto);
        event.setStatus(com.vnticket.entity.EventStatus.PENDING);

        // Find organizer User
        com.vnticket.entity.User organizer = new com.vnticket.entity.User();
        organizer.setId(userId);
        event.setOrganizer(organizer);

        Event savedEvent = eventRepository.save(event);
        saveTicketTypes(eventDto, savedEvent);
        return mapToDto(savedEvent);
    }

    private void saveTicketTypes(EventDto eventDto, Event savedEvent) {
        if (eventDto.getTicketTypes() != null && !eventDto.getTicketTypes().isEmpty()) {
            List<TicketType> ticketTypes = eventDto.getTicketTypes().stream()
                    .map(dto -> {
                        TicketType tt = mapToTicketTypeEntity(dto);
                        tt.setEvent(savedEvent);
                        return tt;
                    }).collect(Collectors.toList());
            ticketTypeRepository.saveAll(ticketTypes);
            savedEvent.setTicketTypes(ticketTypes);
        }
    }

    @Override
    @Transactional
    public void deleteEvent(Long id) {
        log.info("Attempting to delete event ID: {}", id);
        if (!eventRepository.existsById(id)) {
            log.error("Failed to delete: Event not found with ID: {}", id);
            throw new ResourceNotFoundException("Event not found with id: " + id);
        }
        eventRepository.deleteById(id);
        log.info("Successfully deleted event ID: {}", id);
    }

    // Mappers
    private EventDto mapToDto(Event event) {
        List<TicketTypeDto> ticketTypeDtos = new ArrayList<>();
        if (event.getTicketTypes() != null) {
            ticketTypeDtos = event.getTicketTypes().stream()
                    .map(this::mapToTicketTypeDto)
                    .collect(Collectors.toList());
        }

        return EventDto.builder()
                .id(event.getId())
                .name(event.getName())
                .imageUrl(event.getImageUrl())
                .additionalImages(event.getAdditionalImages())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .location(event.getLocation())
                .type(event.getType())
                .organizerName(event.getOrganizerName())
                .status(event.getStatus())
                .organizerId(event.getOrganizer() != null ? event.getOrganizer().getId() : null)
                .ticketTypes(ticketTypeDtos)
                .build();
    }

    private Event mapToEntity(EventDto dto) {
        return Event.builder()
                .name(dto.getName())
                .imageUrl(dto.getImageUrl())
                .additionalImages(dto.getAdditionalImages())
                .description(dto.getDescription())
                .startTime(dto.getStartTime())
                .location(dto.getLocation())
                .type(dto.getType())
                .organizerName(dto.getOrganizerName())
                .build();
    }

    private TicketTypeDto mapToTicketTypeDto(TicketType entity) {
        return TicketTypeDto.builder()
                .id(entity.getId())
                .eventId(entity.getEvent() != null ? entity.getEvent().getId() : null)
                .zoneName(entity.getZoneName())
                .price(entity.getPrice())
                .totalQuantity(entity.getTotalQuantity())
                .remainingQuantity(entity.getRemainingQuantity())
                .build();
    }

    private TicketType mapToTicketTypeEntity(TicketTypeDto dto) {
        return TicketType.builder()
                .zoneName(dto.getZoneName())
                .price(dto.getPrice())
                .totalQuantity(dto.getTotalQuantity())
                .remainingQuantity(
                        dto.getRemainingQuantity() != null ? dto.getRemainingQuantity() : dto.getTotalQuantity())
                .build();
    }
}
