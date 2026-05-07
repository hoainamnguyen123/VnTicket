package com.vnticket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.cache.annotation.EnableCaching;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@EnableCaching
public class VnTicketApplication {

    @PostConstruct
    public void init() {
        // Cấu hình múi giờ chuẩn của ứng dụng là giờ Việt Nam
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
    }

    public static void main(String[] args) {
        // Ép JVM sử dụng IPv4 để tránh lỗi rớt mạng (Timeout) khi phân giải IPv6 trên một số Cloud Provider (Render)
        System.setProperty("java.net.preferIPv4Stack", "true");
        SpringApplication.run(VnTicketApplication.class, args);
    }

}
