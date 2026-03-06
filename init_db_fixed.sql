SET client_encoding = 'UTF8';

TRUNCATE TABLE booking_details, bookings, ticket_types, events, users RESTART IDENTITY CASCADE;

INSERT INTO users (username, password, full_name, email, phone, role) VALUES 
('admin', '$2a$10$wY1tx.x0yP9bQoF4wX9zOu8pC5x5NItlH/gB9HnQxk5d09b6u4i5y', 'System Administrator', 'admin@vnticket.com', '0987654321', 'ROLE_ADMIN'),
('user1', '$2a$10$wY1tx.x0yP9bQoF4wX9zOu8pC5x5NItlH/gB9HnQxk5d09b6u4i5y', 'John Doe', 'user1@vnticket.com', '0123456789', 'ROLE_USER');

INSERT INTO events (id, name, image_url, description, start_time, location, type) 
OVERRIDING SYSTEM VALUE
VALUES
(1, 'BlackPink World Tour 2026', 'https://kenh14cdn.com/203336854389633024/2023/6/26/photo-5-1687756182583272935275.jpg', 'Concert âm nhạc hoành tráng nhất năm', '2026-12-20 19:30:00', 'Sân Vận Động Mỹ Đình, Hà Nội', 'CONCERT'),
(2, 'VietNam vs Thailand - Chung kết AFF Cup', 'https://vff.org.vn/wp-content/uploads/2022/12/320140685_915443206297314_2961817757697410497_n.jpg', 'Trận bóng đá siêu kinh điển Đông Nam Á', '2026-11-15 19:00:00', 'Sân Vận Động Mỹ Đình, Hà Nội', 'FOOTBALL'),
(3, 'The Eras Tour - Taylor Swift', 'https://media.cnn.com/api/v1/images/stellar/prod/230318182740-02-taylor-swift-eras-tour.jpg', 'Chuyến lưu diễn thế giới hoành tráng của Taylor Swift', '2026-10-10 20:00:00', 'Sân Vận Động Quốc Gia, Singapore', 'CONCERT'),
(4, 'Hà Nội FC vs HAGL - V.League 1', 'https://vpf.vn/wp-content/uploads/2023/10/hanoi-hagl.jpg', 'Trận cầu tâm điểm vòng 10 V.League', '2026-06-25 19:15:00', 'Sân Vận Động Hàng Đẫy, Hà Nội', 'FOOTBALL');

SELECT setval('events_id_seq', 4);

INSERT INTO ticket_types (event_id, zone_name, price, total_quantity, remaining_quantity, version) VALUES
(1, 'VIP', 9800000, 500, 500, 0),
(1, 'CAT 1', 6800000, 1000, 1000, 0),
(1, 'CAT 2', 3800000, 2000, 2000, 0),
(2, 'Khán Đài A', 1500000, 5000, 5000, 0),
(2, 'Khán Đài B', 1500000, 5000, 5000, 0),
(2, 'Khán Đài C', 800000, 8000, 8000, 0),
(2, 'Khán Đài D', 800000, 8000, 8000, 0),
(3, 'VIP (Diamond)', 25000000, 200, 200, 0),
(3, 'CAT 1', 15000000, 1000, 1000, 0),
(3, 'CAT 2', 10000000, 2000, 2000, 0),
(4, 'Khán Đài A', 300000, 3000, 3000, 0),
(4, 'Khán Đài B', 250000, 3000, 3000, 0),
(4, 'Khán Đài C, D', 150000, 5000, 5000, 0);
