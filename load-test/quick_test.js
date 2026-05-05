/**
 * BƯỚC 1: Test đơn giản — chỉ gọi GET /api/events
 * Chạy: k6 run load-test/quick_test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,         // 10 người dùng ảo
  duration: '15s', // chạy trong 15 giây
};

export default function () {
  const res = http.get('http://localhost:8080/api/events?page=0&size=10');

  check(res, {
    'status là 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
