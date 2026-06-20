package com.vnticket.util;

import com.vnticket.exception.BadRequestException;
import com.vnticket.security.services.UserDetailsImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityUtilsTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void returnsAuthenticatedUserId() {
        UserDetailsImpl principal = new UserDetailsImpl(
                42L, "tester", "tester@example.com", "secret",
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        assertThat(SecurityUtils.getCurrentUserId()).isEqualTo(42L);
    }

    @Test
    void rejectsAnonymousRequest() {
        assertThatThrownBy(SecurityUtils::getCurrentUserId)
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("authenticated");
    }
}
