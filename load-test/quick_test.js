/**
 * BƯỚC 1: Test đơn giản — chỉ gọi GET /api/events
 * Chạy: k6 run load-test/quick_test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Dùng chiến thuật Ramping (Tăng ga từ từ) để dò tìm "Điểm gục ngã"
  stages: [
    { duration: '15s', target: 500 },  // 15 giây đầu: từ từ tăng lên 500 bot
    { duration: '30s', target: 3000 }, // 30 giây tiếp theo: rồ ga ép lên 3000 bot
    { duration: '15s', target: 0 },    // 15 giây cuối: giảm dần về 0
  ],
};

export default function () {
  const res = http.get('http://localhost:8080/api/events?page=0&size=10');

  check(res, {
    'status là 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Mình đã xóa lệnh sleep(1); ở đây. 
  // Bây giờ các bot sẽ spam request liên tục KHÔNG NGHỈ thay vì chờ 1 giây!
}
