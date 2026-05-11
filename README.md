# 🎫 VNTicket — Event & Football Ticket Booking Platform

**VNTicket** là nền tảng đặt vé sự kiện trực tuyến (Concert, Thể thao, Lễ hội) được xây dựng theo kiến trúc **Fullstack** với khả năng xử lý đồng thời cao (high-concurrency), tích hợp thanh toán **VNPay** và gửi vé điện tử qua **Email** kèm mã **QR Code**.

> **Live Demo:** [https://vnticket.io.vn](https://vnticket.io.vn)

---

## 📑 Mục lục

- [Kiến trúc Hệ thống](#-kiến-trúc-hệ-thống)
- [Tech Stack](#-tech-stack)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Luồng đặt vé & Kỹ thuật Backend](#-luồng-đặt-vé--kỹ-thuật-backend)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Biến môi trường](#-biến-môi-trường)
- [API Endpoints chính](#-api-endpoints-chính)

---

## 🏗 Kiến trúc Hệ thống

```
┌─────────────────┐         ┌──────────────────────────────────────────────────┐
│   React Client  │ ◄─REST──►│            Spring Boot API Server              │
│  (Vite + AntD)  │         │                                                  │
└─────────────────┘         │  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │
                            │  │  Security   │  │  Service  │  │  Scheduler  │  │
                            │  │ JWT Filter  │  │   Layer   │  │ (Cron Jobs) │  │
                            │  └─────┬──────┘  └────┬─────┘  └──────┬──────┘  │
                            │        │              │               │          │
                            └────────┼──────────────┼───────────────┼──────────┘
                                     │              │               │
              ┌──────────────────────┼──────────────┼───────────────┼──────┐
              │                      ▼              ▼               ▼      │
              │  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌─────────┐  │
              │  │  Redis   │  │ RabbitMQ │  │ PostgreSQL │  │  VNPay  │  │
              │  │ (Stock + │  │ (Async   │  │    (JPA    │  │ Gateway │  │
              │  │  Cache)  │  │  Queue)  │  │  + @Lock)  │  │         │  │
              │  └──────────┘  └──────────┘  └────────────┘  └─────────┘  │
              │                                                            │
              │  ┌────────────────┐  ┌────────────────┐                    │
              │  │   Cloudinary   │  │ Resend Email  │                    │
              │  │ (Image Upload) │  │   (QR Ticket)  │                    │
              │  └────────────────┘  └────────────────┘                    │
              └────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **Spring Boot** | 3.2.4 | Framework chính |
| **Java** | 17 | Ngôn ngữ lập trình |
| **Spring Security** | 6.x | Xác thực & phân quyền (JWT + Google OAuth2) |
| **Spring Data JPA** | 3.x | ORM, Optimistic Locking (`@Version`) |
| **PostgreSQL** | 16 | Cơ sở dữ liệu quan hệ |
| **Redis (Jedis)** | — | Quản lý tồn kho real-time (Atomic Counter + ZSET) |
| **RabbitMQ** | — | Message Queue xử lý đặt vé bất đồng bộ |
| **VNPay SDK** | 2.1.0 | Cổng thanh toán trực tuyến (HMAC-SHA512) |
| **Resend** | — | Gửi email xác nhận vé kèm QR Code |
| **Cloudinary** | 1.36.0 | Upload & quản lý hình ảnh sự kiện |
| **ZXing** | 3.5.3 | Sinh mã QR Code cho vé điện tử |
| **Bucket4j** | 8.3.0 | Rate Limiting bảo vệ API |
| **Thymeleaf** | — | Template engine cho email HTML |
| **Lombok** | — | Giảm boilerplate code |

### Frontend

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **React** | 19.2 | UI Library |
| **Vite** | 7.3 | Build tool (HMR siêu nhanh) |
| **Ant Design** | 6.3 | UI Component Library (Responsive) |
| **Axios** | 1.13 | HTTP Client (JWT Interceptor tự động) |
| **React Router** | 7.13 | Định tuyến SPA |
| **React Query** | 5.99 | Server state management & caching |
| **i18next** | 25.x | Đa ngôn ngữ (Việt / English) |
| **Recharts** | 3.8 | Dashboard biểu đồ thống kê |
| **qrcode.react** | 4.2 | Render QR Code phía client |

### Hạ tầng triển khai (Production)

| Dịch vụ | Vai trò |
|---|---|
| **Render** | Deploy Backend (Docker) + Frontend (Static) |
| **Aiven** | Managed PostgreSQL, Redis, RabbitMQ (Cloud) |
| **Cloudinary** | CDN hình ảnh |
| **Resend** | Email transactional |

---

## ✨ Tính năng nổi bật

### 👤 Người dùng
- Đăng ký / Đăng nhập (Email + OTP verification, Google OAuth2)
- Quên mật khẩu qua OTP Email
- Duyệt sự kiện theo **danh mục** và **khu vực** (Hà Nội, TP.HCM, Đà Nẵng, Đà Lạt, Khác)
- Tìm kiếm sự kiện với **Autocomplete**
- Đặt vé với chọn Zone + số lượng (tối đa 5 vé/lần)
- Thanh toán qua **VNPay** (Sandbox) hoặc Mock Payment
- Nhận vé điện tử qua **Email** kèm mã **QR Code**
- Xem lịch sử đặt vé, vé điện tử, chuyển nhượng vé
- Giao diện **Dark Mode** + **Đa ngôn ngữ** (VI/EN)
- Responsive hoàn toàn (**Mobile-first**)

### 🔧 Admin / Organizer
- Dashboard thống kê doanh thu, lượng vé, biểu đồ trực quan (Recharts)
- Quản lý sự kiện: Tạo / Duyệt / Từ chối / Sửa
- Quản lý loại vé động (thêm / sửa / xóa ticket types cho sự kiện đã duyệt)
- Quản lý người dùng
- **Organizer Hub**: Đăng ký ban tổ chức, gửi sự kiện chờ duyệt, xem thống kê sự kiện riêng
- Hỗ trợ sự kiện **multi-session** (nhiều ngày)

---

## 🔄 Luồng đặt vé & Kỹ thuật Backend

Đây là phần cốt lõi và phức tạp nhất của hệ thống, được thiết kế để xử lý **hàng ngàn request đồng thời** mà không bán thừa vé.

### Tổng quan luồng

```
User nhấn "Đặt vé"
    │
    ▼
┌─ VALIDATION ──────────────────────────────────────┐
│  • Số lượng hợp lệ? (1-5)                        │
│  • Đang có đơn PENDING? (Chống giam vé)           │
│  • Email đã xác thực?                             │
└───────────────────────────┬───────────────────────┘
                            ▼
┌─ REDIS: Atomic Decrement ─────────────────────────┐
│  DECR ticket_stock:{ticketTypeId}                  │
│  Nếu result < 0 → Rollback INCR → "Hết vé"       │
└───────────────────────────┬───────────────────────┘
                            ▼
┌─ RABBITMQ: Enqueue ───────────────────────────────┐
│  Gửi BookingMessageDTO vào booking_queue           │
│  Trả HTTP 202 "PENDING" cho User ngay lập tức     │
└───────────────────────────┬───────────────────────┘
                            ▼  (Background Worker)
┌─ CONSUMER: Persist to DB ─────────────────────────┐
│  INSERT → bookings, booking_details, tickets       │
│  Sinh mã vé: VNT-{Base36_Timestamp}-{UUID_5ký_tự} │
│  ZADD reservations (TTL 15 phút)                   │
└───────────────────────────┬───────────────────────┘
                            ▼
┌─ PAYMENT: VNPay / Mock ──────────────────────────┐
│  Thanh toán thành công:                           │
│  • Status → PAID                                  │
│  • ZREM reservation (Redis)                       │
│  • remainingQuantity -= qty (DB + @Version Lock)  │
│  • Gửi Email QR (afterCommit)                     │
│                                                   │
│  Quá hạn 15 phút (Scheduler mỗi 30s):            │
│  • Status → CANCELLED                             │
│  • INCR ticket_stock (Hoàn vé vào Redis)          │
└───────────────────────────────────────────────────┘
```

### Kỹ thuật xử lý chính

| # | Kỹ thuật | Vấn đề giải quyết | File tham khảo |
|---|---|---|---|
| 1 | **Redis Atomic Decrement** | Flash Sale: 10.000+ người đặt cùng lúc → phải đảm bảo không bán thừa vé | `TicketInventoryRedisService.java` |
| 2 | **RabbitMQ Async Processing** | Ghi DB chậm → User phải chờ lâu; tách ra xử lý background, trả response <100ms | `BookingProducer.java`, `BookingConsumer.java` |
| 3 | **JPA Optimistic Locking (`@Version`)** | 2 thanh toán đồng thời ghi đè `remainingQuantity` | `TicketType.java` (entity) |
| 4 | **Redis ZSET Reservation** | Vé bị "giam" vĩnh viễn nếu user không thanh toán; Scheduler quét ZSET mỗi 30s giải phóng vé | `ReservationCleanupTask.java` |
| 5 | **Transaction Synchronization** | Email gửi trước khi DB commit → vé giả; dùng `afterCommit()` đảm bảo gửi sau khi persist thành công | `BookingServiceImpl.java` |
| 6 | **DB→Redis Sync on Startup** | Redis mất data khi restart; Runner đọc DB khôi phục stock chính xác | `TicketInventorySyncRunner.java` |
| 7 | **HMAC-SHA512 Signature** | Giả mạo callback thanh toán VNPay; ký + xác thực chữ ký mọi request | `VnPayService.java` |
| 8 | **Bucket4j Rate Limiting** | Chống DDoS / brute-force API | `filter/` package |

### Dual-Layer Inventory (Tồn kho 2 tầng)

```
         ┌─────────────────────────────────────────────────────────┐
         │              LAYER 1: REDIS (Hot Path)                  │
         │                                                         │
         │  ticket_stock:{id} ──► Atomic DECR/INCR                 │
         │  reservations (ZSET) ──► Score = expireTime (epoch ms)  │
         │                                                         │
         │  ✦ Single-threaded, NO lock contention                  │
         │  ✦ Microsecond latency                                  │
         │  ✦ Xử lý mọi request đặt/hủy real-time                 │
         └──────────────────────────┬──────────────────────────────┘
                                    │ Sync
         ┌──────────────────────────▼──────────────────────────────┐
         │            LAYER 2: PostgreSQL (Cold Path)              │
         │                                                         │
         │  ticket_types.remainingQuantity + @Version              │
         │                                                         │
         │  ✦ Source of Truth (nguồn dữ liệu chính thức)          │
         │  ✦ Chỉ update khi thanh toán thành công                 │
         │  ✦ Optimistic Locking chống race condition              │
         │  ✦ Crash recovery: Runner sync DB→Redis khi restart     │
         └─────────────────────────────────────────────────────────┘
```

---

## 📂 Cấu trúc thư mục

```
VNTicket/
├── vnticket-backend/
│   └── src/main/java/com/vnticket/
│       ├── config/             # Redis, RabbitMQ, VNPay, Cloudinary config
│       ├── controller/         # REST API endpoints
│       ├── dto/                # Request/Response DTOs + ApiResponse wrapper
│       ├── entity/             # JPA Entities (Booking, TicketType, Ticket, ...)
│       ├── enums/              # BookingStatus, TicketStatus, Role, ...
│       ├── exception/          # GlobalExceptionHandler (@ControllerAdvice)
│       ├── filter/             # JWT AuthTokenFilter, Rate Limiting
│       ├── rabbitmq/           # BookingProducer, BookingConsumer
│       ├── repository/         # Spring Data JPA Repositories
│       ├── runner/             # TicketInventorySyncRunner (DB→Redis on startup)
│       ├── scheduler/          # ReservationCleanupTask, BookingCleanupTask
│       ├── security/           # JWT Utils, UserDetailsService
│       └── service/            # Business Logic (Booking, Event, VnPay, Redis, ...)
│
├── vnticket-frontend/
│   └── src/
│       ├── api/                # Axios instance + API service functions
│       ├── components/         # Navbar, Footer, EventCard, ElectronicTicketModal, ...
│       ├── context/            # AuthContext (JWT state management)
│       ├── i18n/               # vi.json, en.json (đa ngôn ngữ)
│       ├── pages/              # Home, EventDetail, History, Admin, Login, ...
│       └── App.jsx             # React Router + Layout
│
├── load-test/                  # Kịch bản load test
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu môi trường

| Phần mềm | Phiên bản |
|---|---|
| Java JDK | 17+ |
| Maven | 3.8+ |
| Node.js | 22.x |
| PostgreSQL | 14+ |
| Redis | 7+ |
| RabbitMQ | 3.12+ |

### 1. Clone dự án

```bash
git clone https://github.com/hoainamnguyen123/VnTicket.git
cd VnTicket
```

### 2. Cài đặt PostgreSQL

```sql
-- Tạo database
CREATE DATABASE vnticket;
```

Cập nhật thông tin kết nối trong `vnticket-backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/vnticket
    username: postgres
    password: <your_password>
```

> **Note:** Hibernate tự động tạo bảng khi ứng dụng chạy lần đầu (`ddl-auto: update`).

### 3. Khởi động Redis & RabbitMQ

```bash
# Redis (Docker)
docker run -d --name redis -p 6379:6379 redis:7

# RabbitMQ (Docker)
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 4. Chạy Backend

```bash
cd vnticket-backend
mvn clean install -DskipTests
mvn spring-boot:run
```

Server khởi chạy tại: `http://localhost:8080`

### 5. Chạy Frontend

```bash
cd vnticket-frontend
npm install
npm run dev
```

Website hiển thị tại: `http://localhost:5173`

---

## 🔐 Biến môi trường

Trong môi trường **Production**, cấu hình qua biến môi trường (xem `application-prod.yml`):

| Biến | Mô tả |
|---|---|
| `DATABASE_URL` | JDBC URL PostgreSQL |
| `DB_USERNAME` / `DB_PASSWORD` | Tài khoản database |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Kết nối Redis |
| `RABBITMQ_HOST` / `RABBITMQ_USERNAME` / `RABBITMQ_PASSWORD` | Kết nối RabbitMQ |
| `JWT_SECRET` | Secret key cho JWT signing |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID |
| `VNPAY_TMN_CODE` / `VNPAY_HASH_SECRET` | Thông tin merchant VNPay |
| `VNPAY_RETURN_URL` | URL redirect sau thanh toán |
| `RESEND_API_KEY` | API key Resend (Email) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `CORS_ALLOWED_ORIGINS` | Domain frontend được phép gọi API |

---

## 📡 API Endpoints chính

### Authentication (`/api/auth`)

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập (trả JWT) |
| `POST` | `/api/auth/google` | Đăng nhập bằng Google |
| `POST` | `/api/auth/verify-email` | Xác thực email qua OTP |
| `POST` | `/api/auth/forgot-password` | Gửi OTP quên mật khẩu |
| `POST` | `/api/auth/reset-password` | Đặt lại mật khẩu |

### Events (`/api/events`)

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/events` | Lấy danh sách sự kiện (có phân trang, filter) |
| `GET` | `/api/events/{id}` | Chi tiết sự kiện + danh sách vé |
| `POST` | `/api/events` | Tạo sự kiện mới (Admin/Organizer) |

### Bookings (`/api/bookings`)

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/bookings` | **Đặt vé** (Redis → RabbitMQ → DB) |
| `GET` | `/api/bookings/my` | Lịch sử đặt vé của tôi |
| `PUT` | `/api/bookings/{id}/cancel` | Hủy đơn đặt vé |
| `GET` | `/api/bookings/{id}/tickets` | Xem vé điện tử |

### Payment (`/api/payment`)

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/payment/create` | Tạo URL thanh toán VNPay |
| `GET` | `/api/payment/vnpay-ipn` | IPN callback (Server-to-Server) |
| `GET` | `/api/payment/vnpay-return` | Return URL verification |

---

## 📄 License

This project is for educational purposes.

---

> **Author:** Nguyen Hoai Nam  
> **Contact:** [GitHub](https://github.com/hoainamnguyen123)
