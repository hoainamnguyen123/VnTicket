package com.vnticket.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class NetworkUtilsTest {

    @Test
    void returnsFirstForwardedAddress() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.2");

        assertThat(NetworkUtils.getClientIp(request)).isEqualTo("203.0.113.10");
    }

    @Test
    void normalizesIpv6Localhost() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("0:0:0:0:0:0:0:1");

        assertThat(NetworkUtils.getClientIp(request)).isEqualTo("127.0.0.1");
    }
}
