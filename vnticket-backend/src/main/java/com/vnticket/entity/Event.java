package com.vnticket.entity;

import com.vnticket.enums.EventStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "events", indexes = {
    @Index(name = "idx_event_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String imageUrl;

    @ElementCollection
    @CollectionTable(name = "event_images", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "image_url")
    private List<String> additionalImages;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private String location;

    private String type; // CONCERT, FOOTBALL

    private String organizerName;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TicketType> ticketTypes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'APPROVED'")
    @Builder.Default
    private EventStatus status = EventStatus.APPROVED;

    @Column(name = "is_slider", columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isSlider = false;

    @Column(name = "is_featured", columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isFeatured = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id")
    private User organizer;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;
}
