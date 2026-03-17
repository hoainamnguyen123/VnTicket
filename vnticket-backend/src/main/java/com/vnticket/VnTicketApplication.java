package com.vnticket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VnTicketApplication {

    public static void main(String[] args) {
        SpringApplication.run(VnTicketApplication.class, args);
    }

}
