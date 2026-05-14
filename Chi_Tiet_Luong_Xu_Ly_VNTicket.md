# TÀI LIỆU CHI TIẾT: LUỒNG XỬ LÝ BACKEND HỆ THỐNG VNTICKET

Tài liệu này cung cấp cái nhìn toàn diện và sâu sắc về kiến trúc, luồng đi của dữ liệu từ Client đến Database thông qua hệ thống Backend Spring Boot.

---

## 1. TỔNG QUAN CÁC MODULE TRONG HỆ THỐNG

| Module | Controllers | Chức năng chính |
|--------|-------------|-----------------|
| **Authentication** | `AuthController` | Xử lý Login, Register, Google OAuth, Refresh Token, OTP Email, Forgot Password. Sử dụng JWT Filter và Redis để lưu trữ Refresh Token/OTP. |
| **Event** | `EventController` | Quản lý Sự kiện (Tạo, Sửa, Xóa). Admin phê duyệt. Hỗ trợ sự kiện nhiều ngày (Multi-day sessions). Tìm kiếm và lọc sự kiện. |
| **Booking** | `BookingController` | Quản lý Đặt vé bất đồng bộ (RabbitMQ). Kiểm tra số lượng bằng Redis. Sử dụng JPA Optimistic Locking và Database Transactional. |
| **Payment** | `PaymentController` | Thanh toán vé qua cổng VNPay. Nhận IPN Callback từ VNPay để cập nhật trạng thái thanh toán. |
| **User** | `UserController` | Quản lý thông tin hồ sơ (Profile) của người dùng. |
| **Ticket Transfer** | `TicketTransferController` | Xử lý chuyển nhượng vé từ người này sang người khác qua email an toàn. |

---

## 2. BIỂU ĐỒ LUỒNG ĐẶT VÉ BẤT ĐỒNG BỘ (RABBITMQ ASYNC FLOW)

Luồng Đặt Vé là luồng phức tạp nhất trong hệ thống, được thiết kế để chịu tải cao (High Concurrency) thông qua Redis và RabbitMQ.

```mermaid
sequenceDiagram
    participant C as Client (Frontend)
    participant F as JwtAuthTokenFilter
    participant Ctrl as BookingController
    participant Srv as BookingService (Producer)
    participant Redis as Redis (Inventory)
    participant MQ as RabbitMQ Queue
    participant Consumer as BookingServiceImpl (Consumer)
    participant DB as MySQL Database

    C->>F: POST /api/bookings (Kèm JWT Token)
    F-->>F: Giải mã JWT & Xác thực User
    F->>Ctrl: Cho phép Request đi tiếp
    Ctrl->>Srv: Gọi hàm bookTicket(userId, request)
    
    Srv->>Redis: Kiểm tra & Trừ số lượng vé (decrementStock)
    alt Không đủ vé
        Redis-->>Srv: False
        Srv-->>Ctrl: Ném BadRequestException
        Ctrl-->>C: 400 Bad Request ("Not enough tickets")
    else Đủ vé
        Redis-->>Srv: True
        Srv->>MQ: Gửi BookingMessageDTO vào Queue
        Srv-->>Ctrl: Trả về Dummy Booking (PENDING)
        Ctrl-->>C: HTTP 202 Accepted ("Đã tiếp nhận yêu cầu")
    end

    %% Tiến trình ngầm Background %%
    Note over MQ, DB: Tiến trình ngầm (Background Worker)
    MQ->>Consumer: Nhận Message từ Queue
    Consumer->>DB: Bắt đầu @Transactional
    Consumer->>DB: Lưu Entity Booking & BookingDetail
    Consumer->>DB: Sinh mã Vé (Ticket Code) không trùng lặp
    Consumer->>Redis: Tạo Reservation (Giữ chỗ 15 phút)
    Consumer->>DB: Commit Transaction
```

---

## 3. VÍ DỤ CỤ THỂ 1 REQUEST ĐẶT VÉ TỪ A-Z

### BƯỚC 1: Client gửi Request (Fake JSON)

Người dùng (User ID = 42) tiến hành đặt 2 vé cho Sự kiện (Event ID = 105), loại vé (TicketType ID = 12). Client sẽ bắn một HTTP POST request.

**Request Payload:**
```http
POST /api/bookings HTTP/1.1
Host: api.vnticket.com
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
Content-Type: application/json

{
  "eventId": 105,
  "ticketTypeId": 12,
  "quantity": 2
}
```

### BƯỚC 2: Đi qua Security Filter
File: `JwtAuthTokenFilter.java`
- Đánh chặn Request. Lấy `Bearer Token` từ Header.
- Giải mã Token, trích xuất `username` và đưa thông tin User vào `SecurityContextHolder`.

### BƯỚC 3: Xử lý tại Controller
File: `BookingController.java`
- Map vào endpoint `@PostMapping`.
- `@Valid` kiểm tra dữ liệu payload có hợp lệ không.
- Gọi hàm: `bookingService.bookTicket(userId, bookingRequest)`.

### BƯỚC 4: Service xử lý Validate & Trừ Redis (Producer)
File: `BookingServiceImpl.java` (Method: `bookTicket`)
- **Kiểm tra nghiệp vụ:** User có đang bị kẹt đơn PENDING không? Số lượng <= 5 không?
- **Trừ vé Redis:** Gọi `inventoryRedisService.decrementStock(12, 2)`. Redis trừ đi 2 vé trực tiếp trên bộ nhớ RAM với tốc độ mili-giây.
- **Gửi RabbitMQ:** Đóng gói thông tin thành `BookingMessageDTO` và gửi `bookingProducer.sendBookingMessage()`.
- **Trả về:** Controller ngay lập tức nhận kết quả và trả về HTTP 202.

**Response trả về ngay cho Client (Chỉ mất < 50ms):**
```json
{
  "success": true,
  "message": "Yêu cầu đặt vé đã được tiếp nhận và đang xử lý",
  "data": {
    "id": null,
    "userId": 42,
    "eventId": 105,
    "status": "PENDING",
    "totalAmount": null,
    "bookingDetails": null
  }
}
```
*(Frontend nhận được 202 sẽ chuyển người dùng sang trang "Chờ xác nhận" hoặc "Thanh toán").*

### BƯỚC 5: Consumer ghi vào Database (Xử lý ngầm)
File: `BookingServiceImpl.java` (Method: `processBookingMessage`)
- Worker đọc message từ RabbitMQ.
- Tính tổng tiền: `TicketType.price * 2`.
- `bookingRepository.save()` lưu Booking (Trạng thái = PENDING).
- Sinh mã vé động: Dùng Timestamp Base36 + UUID. Ví dụ: `VNT-LK2J4-A1B2C`.
- `bookingDetailRepository.save()` lưu chi tiết vé.
- Cập nhật Redis: `inventoryRedisService.addReservation()` để hẹn giờ 15 phút thanh toán.

### BƯỚC 6 (Ngoại lệ): Xử lý thất bại (GlobalExceptionHandler)
Nếu ở BƯỚC 4, Redis báo hết vé, hàm sẽ ném ra `BadRequestException`.
Hệ thống sẽ bị chặn bởi `GlobalExceptionHandler` và trả về JSON sau:
```json
{
  "success": false,
  "message": "Not enough tickets available",
  "data": null
}
```
Mã HTTP Code trả về là `400 Bad Request`.
