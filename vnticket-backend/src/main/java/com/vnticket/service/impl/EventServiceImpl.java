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
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final TicketInventoryRedisService inventoryRedisService;

    public EventServiceImpl(EventRepository eventRepository, TicketTypeRepository ticketTypeRepository,
            TicketInventoryRedisService inventoryRedisService) {
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
    @Cacheable(value = "eventDetail", key = "#id")
    public EventDTO getEventById(Long id) {
        log.info("CACHE MISS! Fetching event details from Postgres database for Event ID: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Event not found with ID: {}", id);
                    return new ResourceNotFoundException("Event not found with id: " + id);
                });
        return mapToDto(event);
    }

    @Override
    @Transactional
    @CacheEvict(value = { "events", "eventDetail" }, allEntries = true)
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
    @CacheEvict(value = { "events", "eventDetail" }, allEntries = true)
    public EventDTO updateEventStatus(Long id, com.vnticket.enums.EventStatus status, String rejectionReason) {
        log.info("Updating status for event ID: {} to {}", id, status);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        event.setStatus(status);
        if (status == com.vnticket.enums.EventStatus.REJECTED) {
            event.setRejectionReason(rejectionReason);
        } else {
            event.setRejectionReason(null);
        }
        Event updatedEvent = eventRepository.save(event);
        return mapToDto(updatedEvent);
    }

    @Override
    @Transactional
    @CacheEvict(value = { "events", "eventDetail" }, allEntries = true)
    public void deleteMyEvent(Long userId, Long eventId) {
        log.info("User {} deleting their rejected event ID: {}", userId, eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        if (event.getOrganizer() == null || !event.getOrganizer().getId().equals(userId)) {
            throw new com.vnticket.exception.BadRequestException("Bạn không có quyền xóa sự kiện này.");
        }
        if (event.getStatus() != com.vnticket.enums.EventStatus.REJECTED) {
            throw new com.vnticket.exception.BadRequestException("Chỉ có thể xóa sự kiện đã bị từ chối.");
        }
        eventRepository.deleteById(eventId);
        log.info("Successfully deleted rejected event ID: {} by user {}", eventId, userId);
    }

    @Override
    @Transactional
    @CacheEvict(value = { "events", "eventDetail" }, allEntries = true)
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
    @CacheEvict(value = { "events", "eventDetail" }, allEntries = true)
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

    @Override
    @Transactional
    @CacheEvict(value = { "events", "eventDetail" }, allEntries = true)
    public EventDTO updateMyEvent(Long userId, Long eventId, EventDTO EventDTO) {
        log.info("User {} updating their event ID: {}", userId, eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (event.getOrganizer() == null || !event.getOrganizer().getId().equals(userId)) {
            throw new com.vnticket.exception.BadRequestException("Bạn không có quyền chỉnh sửa sự kiện này.");
        }

        // Update fields (excluding ticket types)
        event.setName(EventDTO.getName());
        event.setImageUrl(EventDTO.getImageUrl());
        event.setAdditionalImages(EventDTO.getAdditionalImages());
        event.setDescription(EventDTO.getDescription());
        event.setStartTime(EventDTO.getStartTime());
        event.setLocation(EventDTO.getLocation());
        event.setType(EventDTO.getType());
        event.setOrganizerName(EventDTO.getOrganizerName());

        // Update status intelligently
        if (event.getStatus() == com.vnticket.enums.EventStatus.APPROVED) {
            event.setStatus(com.vnticket.enums.EventStatus.PENDING_EDIT);
        } else if (event.getStatus() == com.vnticket.enums.EventStatus.REJECTED) {
            event.setStatus(com.vnticket.enums.EventStatus.PENDING);
            event.setRejectionReason(null);
        }

        Event updatedEvent = eventRepository.save(event);
        log.info("Successfully updated user event ID: {} by user {}", eventId, userId);
        return mapToDto(updatedEvent);
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
                log.info("Initialized Redis inventory for new ticket type {}: {}", tt.getId(),
                        tt.getRemainingQuantity());
            });
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = { "events", "eventDetail" }, allEntries = true)
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
                .additionalImages(
                        event.getAdditionalImages() != null ? new java.util.ArrayList<>(event.getAdditionalImages())
                                : new java.util.ArrayList<>())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .location(event.getLocation())
                .type(event.getType())
                .organizerName(event.getOrganizerName())
                .status(event.getStatus())
                .organizerId(event.getOrganizer() != null ? event.getOrganizer().getId() : null)
                .organizerEmail(event.getOrganizer() != null ? event.getOrganizer().getEmail() : null)
                .organizerPhone(event.getOrganizer() != null ? event.getOrganizer().getPhone() : null)
                .ticketTypes(TicketTypeDTOs)
                .isSlider(event.getIsSlider())
                .isFeatured(event.getIsFeatured())
                .rejectionReason(event.getRejectionReason())
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
                .rejectionReason(dto.getRejectionReason())
                .build();
    }

    private TicketTypeDTO mapToTicketTypeDTO(TicketType entity) {
        // LUÔN LẤY LIVE STOCK TỪ REDIS ĐỂ TRÁNH TRỄ NHỊP DO PENDING BOOKING
        int liveStock = inventoryRedisService.getStock(entity.getId());

        return TicketTypeDTO.builder()
                .id(entity.getId())
                .eventId(entity.getEvent() != null ? entity.getEvent().getId() : null)
                .zoneName(entity.getZoneName())
                .price(entity.getPrice())
                .totalQuantity(entity.getTotalQuantity())
                // Dùng Stock của Redis thay thế cho cột Database (vốn chưa trừ cho đến khi Paid)
                .remainingQuantity(liveStock)
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
