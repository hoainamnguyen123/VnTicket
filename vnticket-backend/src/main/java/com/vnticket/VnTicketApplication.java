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
        SpringApplication.run(VnTicketApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.CommandLineRunner updateOldUsers(com.vnticket.repository.UserRepository userRepository) {
        return args -> {
            System.out.println("--- START DB MIGRATION FOR EXISTING USERS ---");
            java.util.List<com.vnticket.entity.User> users = userRepository.findAll();
            int count = 0;
            for (com.vnticket.entity.User user : users) {
                if (user.getEmailVerified() == null || !user.getEmailVerified()) {
                    user.setEmailVerified(true);
                    userRepository.save(user);
                    count++;
                }
            }
            System.out.println("--- DB MIGRATION COMPLETED: Updated " + count + " users ---");
        };
    }
}
