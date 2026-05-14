package com.vnticket.repository;

import com.vnticket.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    @EntityGraph(attributePaths = "ticketTypes")
    Page<Event> findByTypeContainingIgnoreCase(String type, Pageable pageable);

    @EntityGraph(attributePaths = "ticketTypes")
    @Query("SELECT e FROM Event e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.type) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Event> searchEvents(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "ticketTypes")
    Page<Event> findByStatus(com.vnticket.enums.EventStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "ticketTypes")
    Page<Event> findByTypeContainingIgnoreCaseAndStatus(String type, com.vnticket.enums.EventStatus status,
            Pageable pageable);

    @EntityGraph(attributePaths = "ticketTypes")
    @Query("SELECT e FROM Event e WHERE (LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.location) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND e.status = :status")
    Page<Event> searchEventsByStatus(@Param("keyword") String keyword,
            @Param("status") com.vnticket.enums.EventStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "ticketTypes")
    Page<Event> findByLocationContainingIgnoreCaseAndStatus(String location, com.vnticket.enums.EventStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "ticketTypes")
    @Query("SELECT e FROM Event e WHERE " +
           "(LOWER(e.location) NOT LIKE '%hà nội%' AND " +
           "LOWER(e.location) NOT LIKE '%hồ chí minh%' AND " +
           "LOWER(e.location) NOT LIKE '%đà nẵng%') AND e.status = :status")
    Page<Event> findByLocationOtherAndStatus(@Param("status") com.vnticket.enums.EventStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "ticketTypes")
    List<Event> findByOrganizerId(Long organizerId);

}
