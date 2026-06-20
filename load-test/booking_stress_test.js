import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Custom metrics ──────────────────────────────────────
const bookingSuccess = new Counter('booking_success');
const bookingFail = new Counter('booking_fail');
const errorRate = new Rate('error_rate');
const bookingDuration = new Trend('booking_duration_ms', true);

// ── Cấu hình test ───────────────────────────────────────
export const options = {
  scenarios: {

    // Kịch bản: Ramping (Tăng dần) để tìm giới hạn đặt vé
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 500 },  // Khởi động 500 bot
        { duration: '30s', target: 1000 }, // Rồ ga lên 1000 bot
        { duration: '15s', target: 0 },    // Kết thúc
      ],
    },
  },

  // Ngưỡng PASS/FAIL
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% request phải < 500ms
    error_rate: ['rate<0.05'],  // Tỷ lệ lỗi < 5%
    http_req_failed: ['rate<0.1'],   // Tỷ lệ HTTP fail < 10%
  },
};

// ── Dữ liệu test ────────────────────────────────────────
const BASE_URL = 'http://localhost:8080';
const EVENT_ID = 1;     // ← Đổi thành event ID thực trong DB
const TICKET_TYPE_ID = 1;  // ← Đổi thành ticket type ID thực

// Tài khoản test: BẠN HÃY THAY BẰNG 1 TÀI KHOẢN ĐANG CÓ TRONG DATABASE CỦA BẠN NHÉ!
const TEST_USERS = [
  { username: 'nam08123', password: 'Nam08122003' } // Sửa username và password ở đây
];

// ── Setup: Đăng nhập lấy token trước ────────────────────
export function setup() {
  const tokens = {};

  for (const user of TEST_USERS) {
    const res = http.post(`${BASE_URL}/api/auth/login`,
      JSON.stringify({ username: user.username, password: user.password }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 200) {
      const body = JSON.parse(res.body);
      // Sửa lại: Backend trả về trường "token" chứ không phải "accessToken"
      tokens[user.username] = body.data?.token || body.token;
      console.log(`✅ Logged in: ${user.username}`);
    } else {
      console.error(`❌ Login failed for ${user.username}: ${res.status}`);
    }
  }

  return tokens; // Truyền sang default function
}

// ── Main test flow ───────────────────────────────────────
export default function (tokens) {
  // Mỗi VU dùng 1 user ngẫu nhiên
  const userIndex = __VU % TEST_USERS.length;
  const user = TEST_USERS[userIndex];
  const token = tokens[user.username];

  if (!token) {
    console.error(`No token for ${user.username}`);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // ── Step 1: Lấy thông tin event (GET) ──
  const eventRes = http.get(`${BASE_URL}/api/events/${EVENT_ID}`, { headers });
  check(eventRes, { 'get event 200': (r) => r.status === 200 });

  // Đã xóa lệnh sleep() ở đây để bot chạy liên tục


  // ── Step 2: Đặt vé (POST) — đây là điểm quan trọng nhất ──
  const startTime = Date.now();

  const bookingRes = http.post(
    `${BASE_URL}/api/bookings`,
    JSON.stringify({
      eventId: 2,
      ticketTypeId: 6,
      quantity: 1,
    }),
    { headers }
  );

  const duration = Date.now() - startTime;
  bookingDuration.add(duration);

  const isSuccess = bookingRes.status === 200 || bookingRes.status === 201 || bookingRes.status === 202;
  errorRate.add(!isSuccess);

  if (isSuccess) {
    bookingSuccess.add(1);
    console.log(`✅ VU${__VU} booked successfully in ${duration}ms`);

    // ── Step 3: Hủy ngay để không block slot (nếu muốn test liên tục) ──
    try {
      const body = JSON.parse(bookingRes.body);
      const bookingId = body.data?.id;
      if (bookingId) {
        http.delete(`${BASE_URL}/api/bookings/${bookingId}`, null, { headers });
      }
    } catch (_) { }

  } else {
    bookingFail.add(1);
    const msg = bookingRes.body?.substring(0, 100);
    console.warn(`❌ VU${__VU} booking failed (${bookingRes.status}): ${msg}`);
  }

  // Đã xóa lệnh sleep(1) ở đây để bot không nghỉ ngơi
}

// ── Teardown: In kết quả tóm tắt ────────────────────────
export function teardown(data) {
  console.log('\n========= KẾT QUẢ LOAD TEST =========');
  console.log('Xem chi tiết ở output terminal phía trên');
  console.log('Kiểm tra: booking_success vs booking_fail');
  console.log('Kiểm tra: booking_duration_ms (p95, p99)');
  console.log('======================================\n');
}
