package com.vnticket.service.impl;

import com.vnticket.config.VnPayConfig;
import com.vnticket.entity.Booking;
import com.vnticket.entity.User;
import com.vnticket.enums.BookingStatus;
import com.vnticket.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VnPayPaymentServiceTest {

    @Mock BookingService bookingService;

    private VnPayPaymentService service;

    @BeforeEach
    void setUp() {
        VnPayConfig config = new VnPayConfig();
        config.setTmnCode("TESTCODE");
        config.setHashSecret("test-secret");
        config.setPayUrl("https://sandbox.example/pay");
        config.setReturnUrl("http://localhost/payment-return");
        service = new VnPayPaymentService(config, bookingService);
    }

    @Test
    void createsPaymentUrlAfterBookingValidation() {
        Booking booking = Booking.builder()
                .id(15L)
                .user(User.builder().id(2L).build())
                .status(BookingStatus.PENDING)
                .totalAmount(new BigDecimal("125000"))
                .build();
        when(bookingService.validateBookingForPayment(15L, 2L)).thenReturn(booking);

        String url = service.createPayment(15L, 2L, "127.0.0.1");

        assertThat(url)
                .startsWith("https://sandbox.example/pay?")
                .contains("vnp_TmnCode=TESTCODE")
                .contains("vnp_Amount=12500000")
                .contains("vnp_SecureHash=");
    }
}
