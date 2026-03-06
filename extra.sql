SET client_encoding = 'UTF8';
INSERT INTO events (name, image_url, description, start_time, location, type) VALUES
('The Eras Tour - Taylor Swift', 'https://media.cnn.com/api/v1/images/stellar/prod/230318182740-02-taylor-swift-eras-tour.jpg', 'Chuyến lưu diễn thế giới hoành tráng của Taylor Swift', '2026-10-10 20:00:00', 'Sân Vận Động Quốc Gia, Singapore', 'CONCERT'),
('Hà Nội FC vs HAGL - V.League 1', 'https://vpf.vn/wp-content/uploads/2023/10/hanoi-hagl.jpg', 'Trận cầu tâm điểm vòng 10 V.League', '2026-06-25 19:15:00', 'Sân Vận Động Hàng Đẫy, Hà Nội', 'FOOTBALL');

INSERT INTO ticket_types (event_id, zone_name, price, total_quantity, remaining_quantity, version) VALUES
(3, 'VIP (Diamond)', 25000000, 200, 200, 0),
(3, 'CAT 1', 15000000, 1000, 1000, 0),
(3, 'CAT 2', 10000000, 2000, 2000, 0),
(4, 'Khán Đài A', 300000, 3000, 3000, 0),
(4, 'Khán Đài B', 250000, 3000, 3000, 0),
(4, 'Khán Đài C, D', 150000, 5000, 5000, 0);
