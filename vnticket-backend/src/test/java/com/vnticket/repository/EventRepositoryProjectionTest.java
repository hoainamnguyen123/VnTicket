package com.vnticket.repository;

import com.vnticket.entity.Event;
import com.vnticket.entity.TicketType;
import com.vnticket.enums.EventStatus;
import com.vnticket.projection.EventCardProjection;
import com.vnticket.projection.BookingStatsProjection;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:vnticket;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class EventRepositoryProjectionTest {

    @Autowired EventRepository eventRepository;
    @Autowired TicketTypeRepository ticketTypeRepository;
    @Autowired BookingRepository bookingRepository;

    @Test
    void cardProjectionReturnsMinimumTicketPrice() {
        Event event = eventRepository.save(Event.builder()
                .name("Projection event")
                .startTime(LocalDateTime.now().plusDays(1))
                .location("Hà Nội")
                .type("CONCERT")
                .status(EventStatus.APPROVED)
                .isSlider(false)
                .isFeatured(true)
                .build());
        ticketTypeRepository.save(TicketType.builder()
                .event(event)
                .zoneName("VIP")
                .price(new BigDecimal("300000"))
                .totalQuantity(100)
                .remainingQuantity(100)
                .build());
        ticketTypeRepository.save(TicketType.builder()
                .event(event)
                .zoneName("Standard")
                .price(new BigDecimal("150000"))
                .totalQuantity(100)
                .remainingQuantity(100)
                .build());

        Page<EventCardProjection> result = eventRepository.findCardByStatus(
                EventStatus.APPROVED, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getMinPrice()).isEqualByComparingTo("150000");
    }

    @Test
    void postgresStyleStatisticsQueryReturnsZeroForEmptyBookings() {
        BookingStatsProjection system = bookingRepository.getSystemStatistics();
        BookingStatsProjection event = bookingRepository.getEventStatistics(999L);

        assertThat(system.getTotalBookings()).isZero();
        assertThat(system.getTotalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(event.getTotalBookings()).isZero();
        assertThat(event.getTotalTicketsPaid()).isZero();
    }
}
