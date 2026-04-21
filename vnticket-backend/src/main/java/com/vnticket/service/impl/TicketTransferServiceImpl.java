package com.vnticket.service.impl;

import com.vnticket.dto.TicketTransferDTO;
import com.vnticket.dto.request.TicketTransferRequest;
import com.vnticket.entity.*;
import com.vnticket.enums.BookingStatus;
import com.vnticket.enums.TicketStatus;
import com.vnticket.exception.BadRequestException;
import com.vnticket.exception.ResourceNotFoundException;
import com.vnticket.repository.*;
import com.vnticket.service.TicketTransferService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TicketTransferServiceImpl implements TicketTransferService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final TicketTransferRepository ticketTransferRepository;

    public TicketTransferServiceImpl(TicketRepository ticketRepository,
                                     UserRepository userRepository,
                                     BookingRepository bookingRepository,
                                     BookingDetailRepository bookingDetailRepository,
                                     TicketTransferRepository ticketTransferRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.ticketTransferRepository = ticketTransferRepository;
    }

    @Override
    @Transactional
    public TicketTransferDTO transferTicket(Long senderId, TicketTransferRequest request) {
        log.info("Ticket transfer request: senderId={}, ticketId={}, recipientEmail={}",
                senderId, request.getTicketId(), request.getRecipientEmail());

        // 1. Validate vé tồn tại
        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vé"));

        // 2. Validate vé thuộc người gửi
        User sender = ticket.getBookingDetail().getBooking().getUser();
        if (!sender.getId().equals(senderId)) {
            throw new BadRequestException("Bạn chỉ có thể chuyển vé của chính mình");
        }

        // 3. Validate trạng thái vé
        if (ticket.getStatus() != TicketStatus.VALID) {
            throw new BadRequestException("Chỉ có thể chuyển vé có trạng thái HỢP LỆ");
        }

        // 4. Validate booking đã thanh toán
        Booking senderBooking = ticket.getBookingDetail().getBooking();
        if (senderBooking.getStatus() != BookingStatus.PAID) {
            throw new BadRequestException("Chỉ có thể chuyển vé từ đơn hàng đã thanh toán");
        }

        // 5. Validate sự kiện chưa diễn ra
        Event event = ticket.getBookingDetail().getTicketType().getEvent();
        if (event.getStartTime() != null && event.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Không thể chuyển vé cho sự kiện đã diễn ra");
        }

        // 6. Tìm người nhận qua email
        User recipient = userRepository.findByEmail(request.getRecipientEmail())
                .orElseThrow(() -> new BadRequestException(
                        "Không tìm thấy người dùng với email: " + request.getRecipientEmail()));

        // 7. Không cho tự chuyển cho chính mình
        if (recipient.getId().equals(senderId)) {
            throw new BadRequestException("Bạn không thể chuyển vé cho chính mình");
        }


        // Lưu mã vé cũ & thông tin gốc
        String oldTicketCode = ticket.getTicketCode();
        BookingDetail senderDetail = ticket.getBookingDetail();
        TicketType ticketType = senderDetail.getTicketType();

        // Sinh mã vé mới cho người nhận
        String timePart = Long.toString(System.currentTimeMillis(), 36).toUpperCase();
        String randomPart = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        String newTicketCode = "VNT-" + timePart + "-" + randomPart;

        // ── 1. Đánh dấu vé gốc là TRANSFERRED (giữ lại trong danh sách người gửi) ──
        ticket.setStatus(TicketStatus.TRANSFERRED);
        ticketRepository.save(ticket);

        // ── 2. Tạo Booking mới cho người nhận (totalAmount = 0, tiền ngoài hệ thống) ──
        Booking recipientBooking = Booking.builder()
                .user(recipient)
                .event(event)
                .bookingTime(LocalDateTime.now())
                .status(BookingStatus.PAID)
                .totalAmount(BigDecimal.ZERO)
                .build();
        recipientBooking = bookingRepository.save(recipientBooking);

        // ── 3. Tạo BookingDetail + Ticket MỚI cho người nhận ──
        BookingDetail recipientDetail = BookingDetail.builder()
                .booking(recipientBooking)
                .ticketType(ticketType)
                .quantity(1)
                .price(senderDetail.getPrice())
                .build();

        Ticket newTicket = Ticket.builder()
                .ticketCode(newTicketCode)
                .bookingDetail(recipientDetail)
                .status(TicketStatus.VALID)
                .build();

        recipientDetail.setTickets(List.of(newTicket));
        bookingDetailRepository.save(recipientDetail);

        // ── 4. Ghi lịch sử chuyển vé ──
        TicketTransfer transfer = TicketTransfer.builder()
                .ticket(newTicket)
                .fromUser(sender)
                .toUser(recipient)
                .oldTicketCode(oldTicketCode)
                .newTicketCode(newTicketCode)
                .transferredAt(LocalDateTime.now())
                .build();
        ticketTransferRepository.save(transfer);

        log.info("Ticket transferred successfully: oldTicketId={}, newTicketId={}, from={}, to={}, oldCode={}, newCode={}",
                ticket.getId(), newTicket.getId(), sender.getUsername(), recipient.getUsername(), oldTicketCode, newTicketCode);

        return mapToDto(transfer, event, ticketType);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketTransferDTO> getTransferHistory(Long userId) {
        List<TicketTransfer> transfers = ticketTransferRepository
                .findByFromUserIdOrToUserIdOrderByTransferredAtDesc(userId, userId);

        return transfers.stream()
                .map(t -> {
                    Event event = t.getTicket().getBookingDetail().getTicketType().getEvent();
                    TicketType ticketType = t.getTicket().getBookingDetail().getTicketType();
                    return mapToDto(t, event, ticketType);
                })
                .collect(Collectors.toList());
    }

    private TicketTransferDTO mapToDto(TicketTransfer transfer, Event event, TicketType ticketType) {
        return TicketTransferDTO.builder()
                .id(transfer.getId())
                .ticketId(transfer.getTicket().getId())
                .oldTicketCode(transfer.getOldTicketCode())
                .newTicketCode(transfer.getNewTicketCode())
                .fromUsername(transfer.getFromUser().getUsername())
                .fromEmail(transfer.getFromUser().getEmail())
                .toUsername(transfer.getToUser().getUsername())
                .toEmail(transfer.getToUser().getEmail())
                .eventName(event.getName())
                .zoneName(ticketType.getZoneName())
                .transferredAt(transfer.getTransferredAt())
                .build();
    }
}
