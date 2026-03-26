package com.vnticket.service.impl;

import com.vnticket.dto.EventDTO;
import com.vnticket.dto.TicketTypeDTO;
import com.vnticket.entity.Event;
import com.vnticket.entity.TicketType;
import com.vnticket.exception.ResourceNotFoundException;
import com.vnticket.repository.EventRepository;
import com.vnticket.repository.TicketTypeRepository;
import com.vnticket.service.EventService;
import com.vnticket.service.TicketInventoryRedisService;
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
    private final TicketInventoryRedisService inventoryRedisService;

    public EventServiceImpl(EventRepository eventRepository, TicketTypeRepository ticketTypeRepository, TicketInventoryRedisService inventoryRedisService) {
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.inventoryRedisService = inventoryRedisService;
    }

    @Override
    public Page<EventDTO> getApprovedEvents(String type, String search, Pageable pageable) {
        log.debug("Executing getApprovedEvents with type: {}, search: {}", type, search);
        Page<Event> events;

        if (search != null && !search.isEmpty()) {
            events = eventRepository.searchEventsByStatus(search, com.vnticket.enums.EventStatus.APPROVED, pageable);
        } else if (type != null && !type.isEmpty()) {
            events = eventRepository.findByTypeContainingIgnoreCaseAndStatus(type,
                    com.vnticket.enums.EventStatus.APPROVED, pageable);
        } else {
            events = eventRepository.findByStatus(com.vnticket.enums.EventStatus.APPROVED, pageable);
        }

        log.debug("Found {} approved events", events.getTotalElements());
        return events.map(this::mapToDto);
    }

    @Override
    public Page<EventDTO> getAdminAllEvents(String type, String search, Pageable pageable) {
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
    public Page<EventDTO> getMyEvents(Long userId, Pageable pageable) {
        log.debug("Fetching events organized by user ID: {}", userId);
        List<Event> events = eventRepository.findByOrganizerId(userId);

        // Manual pagination or custom query for page. For simplicity with existing list
        // interface logic:
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), events.size());
        List<EventDTO> pagedEvents = events.subList(start, end).stream().map(this::mapToDto)
                .collect(Collectors.toList());
        return new org.springframework.data.domain.PageImpl<>(pagedEvents, pageable, events.size());
    }

    @Override
    public EventDTO getEventById(Long id) {
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
    public EventDTO updateEvent(Long id, EventDTO EventDTO) {
        log.info("Updating event ID: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Failed to update: Event not found with ID: {}", id);
                    return new ResourceNotFoundException("Event not found with id: " + id);
                });

        // Update fields
        event.setName(EventDTO.getName());
        event.setImageUrl(EventDTO.getImageUrl());
        event.setAdditionalImages(EventDTO.getAdditionalImages());
        event.setDescription(EventDTO.getDescription());
        event.setStartTime(EventDTO.getStartTime());
        event.setLocation(EventDTO.getLocation());
        event.setType(EventDTO.getType());
        event.setOrganizerName(EventDTO.getOrganizerName());
        // Only update status if provided (admin override context)
        if (EventDTO.getStatus() != null) {
            event.setStatus(EventDTO.getStatus());
        }
        if (EventDTO.getIsSlider() != null) {
            event.setIsSlider(EventDTO.getIsSlider());
        }
        if (EventDTO.getIsFeatured() != null) {
            event.setIsFeatured(EventDTO.getIsFeatured());
        }

        Event updatedEvent = eventRepository.save(event);
        log.info("Successfully updated event ID: {}", id);
        return mapToDto(updatedEvent);
    }

    @Override
    @Transactional
    public EventDTO updateEventStatus(Long id, com.vnticket.enums.EventStatus status) {
        log.info("Updating status for event ID: {} to {}", id, status);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        event.setStatus(status);
        Event updatedEvent = eventRepository.save(event);
        return mapToDto(updatedEvent);
    }

    @Override
    @Transactional
    public EventDTO createAdminEvent(EventDTO EventDTO) {
        log.info("Creating new admin event (auto-approved): {}", EventDTO.getName());
        Event event = mapToEntity(EventDTO);
        event.setStatus(com.vnticket.enums.EventStatus.APPROVED);

        Event savedEvent = eventRepository.save(event);
        saveTicketTypes(EventDTO, savedEvent);
        return mapToDto(savedEvent);
    }

    @Override
    @Transactional
    public EventDTO createMyEvent(Long userId, EventDTO EventDTO) {
        log.info("Creating user event (pending approval) for user: {}", userId);
        Event event = mapToEntity(EventDTO);
        event.setStatus(com.vnticket.enums.EventStatus.PENDING);

        // Find organizer User
        com.vnticket.entity.User organizer = new com.vnticket.entity.User();
        organizer.setId(userId);
        event.setOrganizer(organizer);

        Event savedEvent = eventRepository.save(event);
        saveTicketTypes(EventDTO, savedEvent);
        return mapToDto(savedEvent);
    }

    private void saveTicketTypes(EventDTO EventDTO, Event savedEvent) {
        if (EventDTO.getTicketTypes() != null && !EventDTO.getTicketTypes().isEmpty()) {
            List<TicketType> ticketTypes = EventDTO.getTicketTypes().stream()
                    .map(dto -> {
                        TicketType tt = mapToTicketTypeEntity(dto);
                        tt.setEvent(savedEvent);
                        return tt;
                    }).collect(Collectors.toList());
            List<TicketType> savedTicketTypes = ticketTypeRepository.saveAll(ticketTypes);
            savedEvent.setTicketTypes(savedTicketTypes);
            
            // Sync inventory to Redis for new ticket types
            savedTicketTypes.forEach(tt -> {
                inventoryRedisService.initStock(tt.getId(), tt.getRemainingQuantity());
                log.info("Initialized Redis inventory for new ticket type {}: {}", tt.getId(), tt.getRemainingQuantity());
            });
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
    private EventDTO mapToDto(Event event) {
        List<TicketTypeDTO> TicketTypeDTOs = new ArrayList<>();
        if (event.getTicketTypes() != null) {
            TicketTypeDTOs = event.getTicketTypes().stream()
                    .map(this::mapToTicketTypeDTO)
                    .collect(Collectors.toList());
        }

        return EventDTO.builder()
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
                .ticketTypes(TicketTypeDTOs)
                .isSlider(event.getIsSlider())
                .isFeatured(event.getIsFeatured())
                .build();
    }

    private Event mapToEntity(EventDTO dto) {
        return Event.builder()
                .name(dto.getName())
                .imageUrl(dto.getImageUrl())
                .additionalImages(dto.getAdditionalImages())
                .description(dto.getDescription())
                .startTime(dto.getStartTime())
                .location(dto.getLocation())
                .type(dto.getType())
                .organizerName(dto.getOrganizerName())
                .status(dto.getStatus() != null ? dto.getStatus() : com.vnticket.enums.EventStatus.APPROVED)
                .isSlider(dto.getIsSlider() != null ? dto.getIsSlider() : false)
                .isFeatured(dto.getIsFeatured() != null ? dto.getIsFeatured() : false)
                .build();
    }

    private TicketTypeDTO mapToTicketTypeDTO(TicketType entity) {
        return TicketTypeDTO.builder()
                .id(entity.getId())
                .eventId(entity.getEvent() != null ? entity.getEvent().getId() : null)
                .zoneName(entity.getZoneName())
                .price(entity.getPrice())
                .totalQuantity(entity.getTotalQuantity())
                .remainingQuantity(entity.getRemainingQuantity())
                .build();
    }

    private TicketType mapToTicketTypeEntity(TicketTypeDTO dto) {
        return TicketType.builder()
                .zoneName(dto.getZoneName())
                .price(dto.getPrice())
                .totalQuantity(dto.getTotalQuantity())
                .remainingQuantity(
                        dto.getRemainingQuantity() != null ? dto.getRemainingQuantity() : dto.getTotalQuantity())
                .build();
    }
}
