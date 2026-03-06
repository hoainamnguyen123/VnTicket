# VNTicket - Nền tảng Đặt vé Sự kiện và Bóng đá

Dự án VNTicket là một hệ thống Fullstack hoàn chỉnh phục vụ cho việc đặt vé sự kiện (Concert, Thể thao) trực tuyến.

---

## 🏗️ Kiến trúc Hệ thống Tổng thể

Hệ thống được thiết kế theo kiến trúc **Client-Server** với các chuẩn giao tiếp RESTful API:

1. **Frontend (Client)**: 
   - Sử dụng **ReactJS + Vite**. 
   - State/Auth được quản lý tập trung thông qua `Context API` (AuthContext).
   - Gọi API bằng `Axios` với các Interceptors được cài đặt sẵn để gắn JWT Token tự động vào header và xử lý lỗi Unauthorized (401).
   - Sử dụng **Ant Design (AntD)** để xây dựng giao diện nhanh, đẹp và Responsive.

2. **Backend (Server)**:
   - Được xây dựng trên nền tảng **Spring Boot 3 (Java 17)**.
   - Database sử dụng **PostgreSQL** kết hợp với **Spring Data JPA**.
   - Bảo mật API qua **Spring Security + JWT (JSON Web Token)**. Mọi endpoint đều yêu cầu token hợp lệ trừ đăng nhập, đăng ký và xem sự kiện.
   - Exception handling tập trung thông qua `@ControllerAdvice` (`GlobalExceptionHandler`).
   - DTO (Data Transfer Object) pattern được sử dụng giúp cô lập Entity, bảo mật dữ liệu, chuẩn form trả về `ApiResponse` (Status, Message, Data).

---

## 🔄 Flow Đặt vé (Race Condition & Transaction)

Flow đặt vé là tính năng cốt lõi của VNTicket, được xử lý chặt chẽ như sau:

**1. Từ Frontend (React):**
- Người dùng vào trang Chi tiết sự kiện (`EventDetail.jsx`), gọi API lấy sơ đồ vé (`GET /api/events/{id}`).
- Chọn loại vé (Zone) + nhập số lượng -> Click "Đặt vé".
- Gửi payload JSON (eventId, ticketTypeId, quantity) qua `POST /api/bookings`.

**2. Qua Backend (Spring Boot + Security):**
- JWT Filter (`AuthTokenFilter`) trích xuất JWT từ Request Header `Authorization: Bearer <token>`.
- Nếu JWT hợp lệ, Controller lấy `userId` từ `SecurityContextHolder` và gọi `BookingService`.

**3. Tại Database & Business Logic (Race Condition Handling):**
- `BookingService.bookTicket()` chạy trong môi trường **`@Transactional`**.
- Backend kiểm tra số lượng yêu cầu so với `remainingQuantity` của `TicketType`.
- **Cơ chế chống Race Condition**: Spring Data JPA sử dụng **Optimistic Locking** (annotation `@Version` trong entity `TicketType`).
  - Nếu có 2 người cùng lúc mua vé, khi cả 2 query lấy TicketType thì `version` là X. Người thứ 1 update thay đổi `remainingQuantity` -> `version` = X + 1. 
  - Người thứ 2 lưu data, Database báo lỗi vì `version` hiện tại (X+1) khác với version khi select (X). 
  - Spring throw `ObjectOptimisticLockingFailureException`.
- `GlobalExceptionHandler` đón exception này, trả về mã HTTP 409 (Conflict).
- Nếu hợp lệ, hệ thống tạo bản ghi trong bảng `bookings` và `booking_details`. Số lượng vé còn lại của `TicketType` bị trừ đi tương ứng. 

**4. Trả về Frontend:**
- Trả về mã 200 kèm DTO Booking. 
- Nếu 409, Frontend hiển thị Modal thông báo "Vé vừa được người khác cập nhật" và tải lại trang.

---

## 🚀 Hướng dẫn Cài đặt & Chạy Dự án

Yêu cầu môi trường: **Java 17**, **Maven**, **Node.js (18+)**, **PostgreSQL**.

### 1. Cài đặt CSDL PostgreSQL
- Tạo database với tên `vnticket`.
- Cập nhật username/pass mặc định trong file `d:\VNTicket\vnticket-backend\src\main\resources\application.yml`. (Mặc định: postgres/password).
- Chạy script SQL mock data từ file `d:\VNTicket\database.sql` để tạo dữ liệu test nếu cần (Hibernate tự động generate Table khi app chạy lần đầu).

### 2. Chạy Backend (Spring Boot)
- Mở terminal vào thư mục: `cd d:\VNTicket\vnticket-backend`
- Chạy lệnh build: `mvn clean install -DskipTests`
- Chạy project: `mvn spring-boot:run`
- Server sẽ khởi chạy ở địa chỉ: `http://localhost:8080`.

### 3. Chạy Frontend (React Vite)
- Mở terminal mới vào thư mục: `cd d:\VNTicket\vnticket-frontend`
- Cài đặt thư viện: `npm install` (hoặc `yarn install`)
- Khởi chạy development server: `npm run dev` (hoặc `yarn dev`)
- Website sẽ hiển thị ở `http://localhost:5173`.

---

### Tài khoản Test (nếu bạn chạy Mock SQL)
- **Admin**: admin / 123456
- **User**: user1 / 123456
