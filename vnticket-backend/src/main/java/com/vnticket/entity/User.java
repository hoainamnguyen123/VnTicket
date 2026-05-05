package com.vnticket.entity;

import com.vnticket.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = true)
    private String password;

    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    private String googleId;

    @Column(name = "email_verified", columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean emailVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role;
}
