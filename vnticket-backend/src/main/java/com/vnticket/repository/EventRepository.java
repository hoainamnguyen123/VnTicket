package com.vnticket.repository;

import com.vnticket.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    Page<Event> findByTypeContainingIgnoreCase(String type, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.type) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Event> searchEvents(@Param("keyword") String keyword, Pageable pageable);

    Page<Event> findByStatus(com.vnticket.enums.EventStatus status, Pageable pageable);

    Page<Event> findByTypeContainingIgnoreCaseAndStatus(String type, com.vnticket.enums.EventStatus status,
            Pageable pageable);

    @Query("SELECT e FROM Event e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.location) LIKE LOWER(CONCAT('%', :keyword, '%')) AND e.status = :status")
    Page<Event> searchEventsByStatus(@Param("keyword") String keyword,
            @Param("status") com.vnticket.enums.EventStatus status, Pageable pageable);

    List<Event> findByOrganizerId(Long organizerId);

}
