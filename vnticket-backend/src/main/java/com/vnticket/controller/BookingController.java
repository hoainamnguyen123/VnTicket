package com.vnticket.controller;

import com.vnticket.dto.BookingDTO;
import com.vnticket.dto.request.BookingRequest;
import com.vnticket.dto.response.ApiResponse;
import com.vnticket.dto.TicketDTO;
import com.vnticket.service.BookingService;
import com.vnticket.service.EventService;
import com.vnticket.service.ExportService;
import com.vnticket.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.vnticket.dto.response.BookingStatsDTO;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final EventService eventService;
    private final ExportService exportService;

    public BookingController(
            BookingService bookingService,
            EventService eventService,
            ExportService exportService) {
        this.bookingService = bookingService;
        this.eventService = eventService;
        this.exportService = exportService;
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingStatsDTO>> getStatistics() {
        log.info("Admin fetching booking statistics");
        BookingStatsDTO statistics = bookingService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success("Fetched statistics successfully", statistics));
    }

    @GetMapping("/statistics/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingStatsDTO>> getEventStatistics(@PathVariable Long eventId) {
        log.info("Admin fetching booking statistics for event ID {}", eventId);
        BookingStatsDTO statistics = bookingService.getEventStatistics(eventId);
        return ResponseEntity.ok(ApiResponse.success("Fetched event statistics successfully", statistics));
    }

    @GetMapping("/statistics/my-event/{eventId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingStatsDTO>> getMyEventStatistics(@PathVariable Long eventId) {
        Long userId = getCurrentUserId();
        log.info("User ID [{}] fetching booking statistics for event ID {}", userId, eventId);
        eventService.assertEventOwnership(eventId, userId);
        BookingStatsDTO statistics = bookingService.getEventStatistics(eventId);
        return ResponseEntity.ok(ApiResponse.success("Fetched event statistics successfully", statistics));
    }

    @GetMapping("/event/{eventId}/paid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getPaidBookingsForAdmin(@PathVariable Long eventId) {
        log.info("Admin fetching paid bookings for event ID {}", eventId);
        List<BookingDTO> bookings = bookingService.getPaidBookingsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Fetched paid bookings successfully", bookings));
    }

    @GetMapping("/my-event/{eventId}/paid")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getPaidBookingsForUser(@PathVariable Long eventId) {
        Long userId = getCurrentUserId();
        log.info("User ID [{}] fetching paid bookings for event ID {}", userId, eventId);
        eventService.assertEventOwnership(eventId, userId);
        List<BookingDTO> bookings = bookingService.getPaidBookingsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Fetched paid bookings successfully", bookings));
    }

    private Long getCurrentUserId() {
        return SecurityUtils.getCurrentUserId();
    }

    @GetMapping("/my-event/{eventId}/export/pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> exportMyEventPdf(@PathVariable Long eventId) throws Exception {
        Long userId = getCurrentUserId();
        byte[] report = exportService.exportBookingsToPdf(eventId, userId, false);
        return download(report, "bookings_event_" + eventId + ".pdf", MediaType.APPLICATION_PDF);
    }

    @GetMapping("/my-event/{eventId}/export/excel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> exportMyEventExcel(@PathVariable Long eventId) throws Exception {
        Long userId = getCurrentUserId();
        byte[] report = exportService.exportBookingsToExcel(eventId, userId, false);
        return download(
                report,
                "bookings_event_" + eventId + ".xlsx",
                MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @GetMapping("/event/{eventId}/export/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportEventPdf(@PathVariable Long eventId) throws Exception {
        byte[] report = exportService.exportBookingsToPdf(eventId, null, true);
        return download(report, "bookings_event_" + eventId + ".pdf", MediaType.APPLICATION_PDF);
    }

    @GetMapping("/event/{eventId}/export/excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportEventExcel(@PathVariable Long eventId) throws Exception {
        byte[] report = exportService.exportBookingsToExcel(eventId, null, true);
        return download(
                report,
                "bookings_event_" + eventId + ".xlsx",
                MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    private ResponseEntity<byte[]> download(byte[] content, String filename, MediaType mediaType) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .contentLength(content.length)
                .body(content);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingDTO>> bookTicket(@Valid @RequestBody BookingRequest bookingRequest) {
        Long userId = getCurrentUserId();
        log.info("Received booking request from user ID {} for event ID {}", userId, bookingRequest.getEventId());
        BookingDTO dummyBooking = bookingService.bookTicket(userId, bookingRequest);
        log.info("Delegated booking request to RabbitMQ for user ID {}", userId);
        return ResponseEntity.accepted().body(ApiResponse.success("Yêu cầu đặt vé đã được tiếp nhận và đang xử lý", dummyBooking));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingDTO>>> getMyBookings() {
        Long userId = getCurrentUserId();
        log.info("Fetching bookings for User ID [{}]", userId);
        List<BookingDTO> bookings = bookingService.getMyBookings(userId);
        return ResponseEntity.ok(ApiResponse.success("Fetched my bookings", bookings));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingDTO>> cancelBooking(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        log.info("User ID [{}] attempting to cancel Booking ID: {}", userId, id);
        BookingDTO booking = bookingService.cancelBooking(id, userId);
        log.info("Booking ID: {} cancelled successfully by User ID [{}]", id, userId);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully", booking));
    }

    @PutMapping("/{id}/pay-mock")
    public ResponseEntity<ApiResponse<BookingDTO>> mockPayBooking(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        log.info("User ID [{}] attempting to mock pay Booking ID: {}", userId, id);
        BookingDTO booking = bookingService.mockPayBooking(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Mock Payment successful", booking));
    }

    @GetMapping("/{id}/tickets")
    public ResponseEntity<ApiResponse<List<TicketDTO>>> getTicketsByBooking(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        log.info("Fetching tickets for Booking ID [{}] by User ID [{}]", id, userId);
        List<TicketDTO> tickets = bookingService.getTicketsByBooking(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Fetched tickets successfully", tickets));
    }
}
