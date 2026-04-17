package com.vnticket.repository;

import com.vnticket.entity.TicketTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketTransferRepository extends JpaRepository<TicketTransfer, Long> {
    List<TicketTransfer> findByFromUserIdOrToUserIdOrderByTransferredAtDesc(Long fromUserId, Long toUserId);
}
