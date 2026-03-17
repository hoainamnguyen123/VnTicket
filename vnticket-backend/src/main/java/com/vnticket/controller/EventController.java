package com.vnticket.controller;

import com.vnticket.dto.EventDto;
import com.vnticket.dto.response.ApiResponse;
import com.vnticket.service.EventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // Public API
    @GetMapping("/events")
    public ResponseEntity<ApiResponse<Page<EventDto>>> getAllEvents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startTime") String sortBy) {

        log.info("Fetching events with type: {}, search: {}, page: {}, size: {}", type, search, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, sortBy));
        Page<EventDto> events = eventService.getApprovedEvents(type, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Fetched events", events));
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<ApiResponse<EventDto>> getEventById(@PathVariable Long id) {
        log.info("Fetching event details for id: {}", id);
        EventDto event = eventService.getEventById(id);
        return ResponseEntity.ok(ApiResponse.success("Fetched event", event));
    }

    private Long getCurrentUserId() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        com.vnticket.security.services.UserDetailsImpl userDetails = (com.vnticket.security.services.UserDetailsImpl) authentication
                .getPrincipal();
        return userDetails.getId();
    }

    // User API (My Events)
    @PostMapping("/events/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EventDto>> createMyEvent(@RequestBody EventDto eventDto) {
        Long userId = getCurrentUserId();
        log.info("User {} creating new event: {}", userId, eventDto.getName());
        EventDto createdEvent = eventService.createMyEvent(userId, eventDto);
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", createdEvent));
    }

    @GetMapping("/events/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<EventDto>>> getMyEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startTime") String sortBy) {
        Long userId = getCurrentUserId();
        log.info("Fetching events for user {}", userId);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, sortBy));
        Page<EventDto> events = eventService.getMyEvents(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Fetched user events", events));
    }

    // Admin API
    @GetMapping("/admin/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<EventDto>>> getAdminAllEvents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startTime") String sortBy) {

        log.info("Admin fetching all events with type: {}, search: {}, page: {}, size: {}", type, search, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, sortBy));
        Page<EventDto> events = eventService.getAdminAllEvents(type, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Fetched events", events));
    }

    @PostMapping("/admin/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventDto>> createEvent(@RequestBody EventDto eventDto) {
        log.info("Admin creating new event: {}", eventDto.getName());
        EventDto createdEvent = eventService.createAdminEvent(eventDto);
        log.info("Event created successfully with id: {}", createdEvent.getId());
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", createdEvent));
    }

    @PutMapping("/admin/events/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventDto>> updateEvent(@PathVariable Long id, @RequestBody EventDto eventDto) {
        log.info("Admin updating event with id: {}", id);
        EventDto updatedEvent = eventService.updateEvent(id, eventDto);
        log.info("Event updated successfully with id: {}", id);
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", updatedEvent));
    }

    @PutMapping("/admin/events/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventDto>> updateEventStatus(@PathVariable Long id,
            @RequestParam com.vnticket.entity.EventStatus status) {
        log.info("Admin updating event status id: {} to {}", id, status);
        EventDto updatedEvent = eventService.updateEventStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Event status updated", updatedEvent));
    }

    @DeleteMapping("/admin/events/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> deleteEvent(@PathVariable Long id) {
        log.info("Admin deleting event with id: {}", id);
        eventService.deleteEvent(id);
        log.info("Event deleted successfully with id: {}", id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", null));
    }
}
