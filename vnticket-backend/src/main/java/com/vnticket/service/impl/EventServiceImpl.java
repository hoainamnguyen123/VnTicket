package com.vnticket.service.impl;

import com.vnticket.dto.EventDTO;
import com.vnticket.dto.TicketTypeDTO;
import com.vnticket.entity.Event;
import com.vnticket.entity.TicketType;
import com.vnticket.exception.BadRequestException;
import com.vnticket.exception.ResourceNotFoundException;
import com.vnticket.repository.BookingDetailRepository;
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
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final TicketInventoryRedisService inventoryRedisService;
    private final BookingDetailRepository bookingDetailRepository;

    public EventServiceImpl(EventRepository eventRepository, TicketTypeRepository ticketTypeRepository,
            TicketInventoryRedisService inventoryRedisService,
            BookingDetailRepository bookingDetailRepository) {
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.inventoryRedisService = inventoryRedisService;
        this.bookingDetailRepository = bookingDetailRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EventDTO> getApprovedEvents(String type, String search, String location, Pageable pageable) {
        log.debug("Executing getApprovedEvents with type: {}, search: {}, location: {}", type, search, location);
        Page<Event> events;

        if (search != null && !search.isEmpty()) {
            events = eventRepository.searchEventsByStatus(search, com.vnticket.enums.EventStatus.APPROVED, pageable);
        } else if (location != null && !location.isEmpty()) {
            if ("others".equalsIgnoreCase(location)) {
                events = eventRepository.findByLocationOtherAndStatus(com.vnticket.enums.EventStatus.APPROVED, pageable);
            } else {
                events = eventRepository.findByLocationContainingIgnoreCaseAndStatus(location,
                        com.vnticket.enums.EventStatus.APPROVED, pageable);
            }
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
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
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

    // ──────────────────── Ticket Type Management ────────────────────

    @Override
    @Transactional
    @CacheEvict(value = { "events", "eventDetail" }, allEntries = true)
    public EventDTO updateAdminTicketTypes(Long eventId, List<TicketTypeDTO> ticketTypes) {
        log.info("Admin updating ticket types for event ID: {}", eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        updateTicketTypesInternal(event, ticketTypes);
        // Admin tự approve → giữ nguyên trạng thái APPROVED
        Event saved = eventRepository.save(event);
        log.info("Admin successfully updated ticket types for event ID: {}", eventId);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = { "events", "eventDetail" }, allEntries = true)
    public EventDTO updateMyTicketTypes(Long userId, Long eventId, List<TicketTypeDTO> ticketTypes) {
        log.info("User {} updating ticket types for event ID: {}", userId, eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        // Kiểm tra quyền sở hữu
        if (event.getOrganizer() == null || !event.getOrganizer().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa sự kiện này.");
        }
        // Chỉ cho phép chỉnh sửa sự kiện đang APPROVED
        if (event.getStatus() != com.vnticket.enums.EventStatus.APPROVED) {
            throw new BadRequestException("Chỉ có thể chỉnh sửa loại vé cho sự kiện đã được duyệt.");
        }

        updateTicketTypesInternal(event, ticketTypes);
        // Organizer chỉnh sửa → cần admin xét duyệt lại
        event.setStatus(com.vnticket.enums.EventStatus.PENDING_EDIT);
        Event saved = eventRepository.save(event);
        log.info("User {} updated ticket types for event ID: {}, status → PENDING_EDIT", userId, eventId);
        return mapToDto(saved);
    }

    /**
     * Logic dùng chung để cập nhật danh sách ticket types:
     * - Thêm mới: DTO không có id
     * - Cập nhật: DTO có id tồn tại
     * - Xóa: TicketType hiện tại không xuất hiện trong danh sách DTO mới
     */
    private void updateTicketTypesInternal(Event event, List<TicketTypeDTO> dtoList) {
        List<TicketType> existing = ticketTypeRepository.findByEventId(event.getId());

        // Map existing by id để tra cứu nhanh
        Map<Long, TicketType> existingMap = existing.stream()
                .collect(Collectors.toMap(TicketType::getId, Function.identity()));

        // ID các ticket type được giữ lại / cập nhật
        Set<Long> keptIds = dtoList.stream()
                .filter(dto -> dto.getId() != null)
                .map(TicketTypeDTO::getId)
                .collect(java.util.stream.Collectors.toSet());

        // 1. Xóa các ticket type bị loại bỏ
        for (TicketType tt : existing) {
            if (!keptIds.contains(tt.getId())) {
                // Chặn xóa nếu đã có booking PAID
                if (bookingDetailRepository.existsPaidBookingByTicketTypeId(tt.getId())) {
                    throw new BadRequestException(
                        "Không thể xóa khu vực '" + tt.getZoneName() + "' vì đã có người mua vé thành công.");
                }
                // Xóa Redis key trước
                inventoryRedisService.initStock(tt.getId(), 0);
                ticketTypeRepository.delete(tt);
                log.info("Deleted ticket type ID: {} (zoneName={})", tt.getId(), tt.getZoneName());
            }
        }

        // 2. Cập nhật hoặc thêm mới
        for (TicketTypeDTO dto : dtoList) {
            if (dto.getId() != null && existingMap.containsKey(dto.getId())) {
                // Cập nhật ticket type đã tồn tại
                TicketType tt = existingMap.get(dto.getId());
                int oldTotal = tt.getTotalQuantity();
                int newTotal = dto.getTotalQuantity();
                int sold = oldTotal - tt.getRemainingQuantity();

                if (newTotal < sold) {
                    throw new BadRequestException(
                        "Không thể giảm số lượng vé khu vực '" + tt.getZoneName() +
                        "' xuống dưới số vé đã bán (" + sold + " vé).");
                }

                int delta = newTotal - oldTotal;
                tt.setZoneName(dto.getZoneName());
                tt.setPrice(dto.getPrice());
                tt.setTotalQuantity(newTotal);
                tt.setRemainingQuantity(tt.getRemainingQuantity() + delta);
                ticketTypeRepository.save(tt);

                // Sync Redis: điều chỉnh stock tương ứng với delta
                if (delta > 0) {
                    inventoryRedisService.incrementStock(tt.getId(), delta);
                } else if (delta < 0) {
                    inventoryRedisService.decrementStock(tt.getId(), -delta);
                }
                log.info("Updated ticket type ID: {} → total={}, delta={}", tt.getId(), newTotal, delta);
            } else {
                // Thêm mới ticket type
                TicketType newTt = TicketType.builder()
                        .event(event)
                        .zoneName(dto.getZoneName())
                        .price(dto.getPrice())
                        .totalQuantity(dto.getTotalQuantity())
                        .remainingQuantity(dto.getTotalQuantity())
                        .build();
                TicketType savedTt = ticketTypeRepository.save(newTt);
                inventoryRedisService.initStock(savedTt.getId(), savedTt.getTotalQuantity());
                log.info("Created new ticket type ID: {} for event ID: {}", savedTt.getId(), event.getId());
            }
        }
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
