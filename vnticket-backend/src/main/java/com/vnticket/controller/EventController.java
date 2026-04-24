package com.vnticket.controller;

import com.vnticket.dto.EventDTO;
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
    public ResponseEntity<ApiResponse<Page<EventDTO>>> getAllEvents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        log.info("Fetching events with type: {}, search: {}, location: {}, page: {}, size: {}, sort: {}, dir: {}", 
                type, search, location, page, size, sortBy, direction);
        Sort.Direction sortDir = Sort.Direction.fromString(direction.toUpperCase());
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sortBy));
        Page<EventDTO> events = eventService.getApprovedEvents(type, search, location, pageable);
        return ResponseEntity.ok(ApiResponse.success("Fetched events", events));
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<ApiResponse<EventDTO>> getEventById(@PathVariable Long id) {
        log.info("Fetching event details for id: {}", id);
        EventDTO event = eventService.getEventById(id);
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
    public ResponseEntity<ApiResponse<EventDTO>> createMyEvent(@RequestBody EventDTO EventDTO) {
        Long userId = getCurrentUserId();
        log.info("User {} creating new event: {}", userId, EventDTO.getName());
        EventDTO createdEvent = eventService.createMyEvent(userId, EventDTO);
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", createdEvent));
    }

    @PutMapping("/events/my/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EventDTO>> updateMyEvent(@PathVariable Long id, @RequestBody EventDTO EventDTO) {
        Long userId = getCurrentUserId();
        log.info("User {} updating their event: {}", userId, id);
        EventDTO updatedEvent = eventService.updateMyEvent(userId, id, EventDTO);
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", updatedEvent));
    }

    @GetMapping("/events/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<EventDTO>>> getMyEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        Long userId = getCurrentUserId();
        log.info("Fetching events for user {}, page: {}, size: {}, sort: {}, dir: {}", userId, page, size, sortBy, direction);
        Sort.Direction sortDir = Sort.Direction.fromString(direction.toUpperCase());
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sortBy));
        Page<EventDTO> events = eventService.getMyEvents(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Fetched user events", events));
    }

    @DeleteMapping("/events/my/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> deleteMyEvent(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        log.info("User {} deleting rejected event {}", userId, id);
        eventService.deleteMyEvent(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", null));
    }

    // Admin API
    @GetMapping("/admin/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<EventDTO>>> getAdminAllEvents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        log.info("Admin fetching all events with type: {}, search: {}, page: {}, size: {}, sort: {}, dir: {}", 
                type, search, page, size, sortBy, direction);
        Sort.Direction sortDir = Sort.Direction.fromString(direction.toUpperCase());
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sortBy));
        Page<EventDTO> events = eventService.getAdminAllEvents(type, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Fetched events", events));
    }

    @PostMapping("/admin/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventDTO>> createEvent(@RequestBody EventDTO EventDTO) {
        log.info("Admin creating new event: {}", EventDTO.getName());
        EventDTO createdEvent = eventService.createAdminEvent(EventDTO);
        log.info("Event created successfully with id: {}", createdEvent.getId());
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", createdEvent));
    }

    @PutMapping("/admin/events/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventDTO>> updateEvent(@PathVariable Long id, @RequestBody EventDTO EventDTO) {
        log.info("Admin updating event with id: {}", id);
        EventDTO updatedEvent = eventService.updateEvent(id, EventDTO);
        log.info("Event updated successfully with id: {}", id);
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", updatedEvent));
    }

    @PutMapping("/admin/events/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EventDTO>> updateEventStatus(@PathVariable Long id,
            @RequestParam com.vnticket.enums.EventStatus status,
            @RequestParam(required = false) String rejectionReason) {
        log.info("Admin updating event status id: {} to {}", id, status);
        EventDTO updatedEvent = eventService.updateEventStatus(id, status, rejectionReason);
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
