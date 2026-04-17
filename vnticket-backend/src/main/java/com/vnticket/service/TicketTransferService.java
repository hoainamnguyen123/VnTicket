package com.vnticket.service;

import com.vnticket.dto.TicketTransferDTO;
import com.vnticket.dto.request.TicketTransferRequest;

import java.util.List;

public interface TicketTransferService {

    /**
     * Chuyển vé từ user hiện tại sang user khác (qua email).
     * Sinh mã vé mới, mã cũ hết hiệu lực.
     */
    TicketTransferDTO transferTicket(Long senderId, TicketTransferRequest request);

    /**
     * Lấy lịch sử chuyển vé (cả gửi lẫn nhận) của user.
     */
    List<TicketTransferDTO> getTransferHistory(Long userId);
}
