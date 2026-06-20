package com.vnticket.repository;

import com.vnticket.entity.Event;
import com.vnticket.enums.EventStatus;
import com.vnticket.projection.EventCardProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    String CARD_SELECT = """
            SELECT e.id AS id, e.name AS name, e.imageUrl AS imageUrl,
                   e.startTime AS startTime, e.location AS location, e.type AS type,
                   e.status AS status, e.isSlider AS isSlider, e.isFeatured AS isFeatured,
                   MIN(t.price) AS minPrice
            FROM Event e LEFT JOIN e.ticketTypes t
            """;

    String CARD_GROUP_BY = """
            GROUP BY e.id, e.name, e.imageUrl, e.startTime, e.location, e.type,
                     e.status, e.isSlider, e.isFeatured
            """;

    @Query(CARD_SELECT + " WHERE e.status = :status " + CARD_GROUP_BY)
    Page<EventCardProjection> findCardByStatus(@Param("status") EventStatus status, Pageable pageable);

    @Query(CARD_SELECT
            + " WHERE LOWER(e.type) LIKE LOWER(CONCAT('%', :type, '%')) AND e.status = :status "
            + CARD_GROUP_BY)
    Page<EventCardProjection> findCardByTypeAndStatus(
            @Param("type") String type, @Param("status") EventStatus status, Pageable pageable);

    @Query(CARD_SELECT
            + " WHERE (LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + " OR LOWER(e.location) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
            + " AND e.status = :status " + CARD_GROUP_BY)
    Page<EventCardProjection> searchCardsByStatus(
            @Param("keyword") String keyword, @Param("status") EventStatus status, Pageable pageable);

    @Query(CARD_SELECT
            + " WHERE LOWER(e.location) LIKE LOWER(CONCAT('%', :location, '%')) "
            + " AND e.status = :status " + CARD_GROUP_BY)
    Page<EventCardProjection> findCardByLocationAndStatus(
            @Param("location") String location, @Param("status") EventStatus status, Pageable pageable);

    @Query(CARD_SELECT
            + " WHERE e.status = :status AND e.location IS NOT NULL "
            + " AND LOWER(e.location) NOT LIKE '%hà nội%' "
            + " AND LOWER(e.location) NOT LIKE '%ha noi%' "
            + " AND LOWER(e.location) NOT LIKE '%hồ chí minh%' "
            + " AND LOWER(e.location) NOT LIKE '%ho chi minh%' "
            + " AND LOWER(e.location) NOT LIKE '%đà nẵng%' "
            + " AND LOWER(e.location) NOT LIKE '%da nang%' "
            + CARD_GROUP_BY)
    Page<EventCardProjection> findOtherLocationCards(
            @Param("status") EventStatus status, Pageable pageable);

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

    Page<Event> findByOrganizerId(Long organizerId, Pageable pageable);

}
