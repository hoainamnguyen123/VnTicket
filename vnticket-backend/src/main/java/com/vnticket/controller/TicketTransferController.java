package com.vnticket.controller;

import com.vnticket.dto.TicketTransferDTO;
import com.vnticket.dto.request.TicketTransferRequest;
import com.vnticket.dto.response.ApiResponse;
import com.vnticket.exception.BadRequestException;
import com.vnticket.security.services.UserDetailsImpl;
import com.vnticket.service.TicketTransferService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/tickets/transfer")
public class TicketTransferController {

    private final TicketTransferService ticketTransferService;

    public TicketTransferController(TicketTransferService ticketTransferService) {
        this.ticketTransferService = ticketTransferService;
    }

    /**
     * Chuyển vé cho user khác qua email
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TicketTransferDTO>> transferTicket(
            @RequestBody TicketTransferRequest request) {

        Long userId = getCurrentUserId();
        log.info("User {} requesting ticket transfer: ticketId={}, recipientEmail={}",
                userId, request.getTicketId(), request.getRecipientEmail());

        TicketTransferDTO result = ticketTransferService.transferTicket(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Chuyển vé thành công!", result));
    }

    /**
     * Lấy lịch sử chuyển vé của user hiện tại (cả gửi lẫn nhận)
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<TicketTransferDTO>>> getTransferHistory() {
        Long userId = getCurrentUserId();
        List<TicketTransferDTO> history = ticketTransferService.getTransferHistory(userId);
        return ResponseEntity.ok(ApiResponse.success("Transfer history", history));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            throw new BadRequestException("User not authenticated");
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }
}
