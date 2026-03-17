# 📖 GIẢI THÍCH CHI TIẾT CODE BACKEND - VNTicket

> Tài liệu giải thích toàn bộ code backend theo **luồng chạy** của ứng dụng, từ khi khởi động đến xử lý từng request.

---

## 📋 MỤC LỤC

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Khởi động ứng dụng](#2-khởi-động-ứng-dụng)
3. [Cấu hình (Config)](#3-cấu-hình)
4. [Entity - Mô hình dữ liệu](#4-entity)
5. [Repository - Truy vấn DB](#5-repository)
6. [DTO - Đối tượng truyền dữ liệu](#6-dto)
7. [Security - Bảo mật & JWT](#7-security)
8. [Luồng xác thực (Auth Flow)](#8-luồng-xác-thực)
9. [Luồng quản lý sự kiện (Event Flow)](#9-luồng-quản-lý-sự-kiện)
10. [Luồng đặt vé (Booking Flow)](#10-luồng-đặt-vé)
11. [Luồng quản lý User](#11-luồng-quản-lý-user)
12. [Scheduler - Tác vụ tự động](#12-scheduler)
13. [Exception Handling](#13-exception-handling)

---

## 1. TỔNG QUAN KIẾN TRÚC

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React)                        │
│              http://localhost:5175                        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────────────┐
│              SPRING BOOT BACKEND (:8080)                 │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Security │→ │  Controller  │→ │     Service        │  │
│  │ Filter   │  │  (REST API)  │  │ (Business Logic)   │  │
│  └──────────┘  └──────────────┘  └────────┬──────────┘  │
│                                           │              │
│                                  ┌────────▼──────────┐  │
│                                  │    Repository      │  │
│                                  │   (Data Access)    │  │
│                                  └────────┬──────────┘  │
│                                           │              │
└───────────────────────────────────────────┼──────────────┘
                                            │
                     ┌──────────────────────┼───────────┐
                     ▼                      ▼           │
              ┌────────────┐        ┌────────────┐      │
              │ PostgreSQL │        │   Redis    │      │
              │  (DB chính)│        │(RefreshToken)│    │
              └────────────┘        └────────────┘      │
```

**Công nghệ sử dụng:**
- **Spring Boot 3.2.4** + Java 17
- **Spring Security** + JWT (jjwt 0.11.5)
- **Spring Data JPA** + PostgreSQL
- **Spring Data Redis** (lưu refresh token)
- **Lombok** (giảm boilerplate code)

---

## 2. KHỞI ĐỘNG ỨNG DỤNG

### File: `VnTicketApplication.java`

```java
@SpringBootApplication   // Đánh dấu đây là ứng dụng Spring Boot
                          // Tự động cấu hình: ComponentScan, AutoConfiguration, Configuration
@EnableScheduling         // Bật tính năng chạy tác vụ định kỳ (cron/scheduled tasks)
public class VnTicketApplication {
    public static void main(String[] args) {
        // Khởi chạy ứng dụng Spring Boot
        // - Tạo ApplicationContext (IoC Container)
        // - Quét tất cả package con của com.vnticket để tìm @Component, @Service, @Repository, @Controller
        // - Kết nối PostgreSQL, Redis
        // - Tạo các bảng DB tự động (ddl-auto: update)
        // - Khởi tạo Security Filter Chain
        // - Bắt đầu lắng nghe request trên port 8080
        SpringApplication.run(VnTicketApplication.class, args);
    }
}
```

**Luồng khởi động:**
1. `main()` được gọi → Spring Boot bắt đầu khởi tạo
2. Đọc file `application.yml` để lấy cấu hình
3. Kết nối PostgreSQL (`localhost:5432/vnticket`) và Redis (`localhost:6379`)
4. Hibernate tự tạo/cập nhật bảng theo Entity (ddl-auto: update)
5. Đăng ký tất cả Bean: Controller, Service, Repository, Security Filter...
6. Server Tomcat nhúng lắng nghe trên port 8080

---

## 3. CẤU HÌNH

### File: `application.yml`

```yaml
server:
  port: 8080                    # Server chạy trên port 8080

spring:
  application:
    name: vnticket-backend       # Tên ứng dụng

  datasource:
    url: jdbc:postgresql://localhost:5432/vnticket  # URL kết nối PostgreSQL
    username: postgres           # Tài khoản DB
    password: 123456             # Mật khẩu DB
    driver-class-name: org.postgresql.Driver  # Driver PostgreSQL

  data:
    redis:
      host: localhost            # Redis server address
      port: 6379                 # Redis port (mặc định)

  jpa:
    hibernate:
      ddl-auto: update           # Tự động tạo/cập nhật bảng khi Entity thay đổi
    show-sql: true               # Hiện SQL query trong console (cho debug)
    properties:
      hibernate:
        format_sql: true         # Format SQL cho dễ đọc
        dialect: org.hibernate.dialect.PostgreSQLDialect  # Dialect cho PostgreSQL

app:
  jwt:
    secret: VNTicket...          # Secret key để ký JWT token (phải đủ dài cho HS256)
    expirationMs: 600000         # Access token hết hạn sau 10 phút (600,000ms)
    jwtRefreshExpirationMs: 2592000000  # Refresh token hết hạn sau 30 ngày
```

---

## 4. ENTITY - MÔ HÌNH DỮ LIỆU

### Sơ đồ quan hệ Entity:

```
User (1) ──────< (N) Booking (N) >────── (1) Event
                      │                        │
                      │                        │
               BookingDetail (N) >──── (1) TicketType
                      │
                      │
                 Ticket (N)
```

### 4.1 `User.java` - Bảng người dùng

```java
@Entity                              // Đánh dấu class này là một Entity (tương ứng 1 bảng DB)
@Table(name = "users")               // Tên bảng trong DB là "users"
@Getter @Setter                      // Lombok tự sinh getter/setter cho tất cả field
@NoArgsConstructor @AllArgsConstructor // Sinh constructor không tham số và đầy đủ tham số
@Builder                             // Cho phép tạo đối tượng bằng pattern Builder
public class User {
    @Id                              // Đánh dấu đây là khóa chính (Primary Key)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // ↑ Tự động tăng ID (PostgreSQL dùng SERIAL)
    private Long id;

    @Column(nullable = false, unique = true)
    // ↑ Cột username: NOT NULL + UNIQUE (không được trùng)
    private String username;

    @Column(nullable = false)        // Mật khẩu: NOT NULL (đã mã hóa BCrypt)
    private String password;

    private String fullName;         // Họ tên đầy đủ (có thể null)

    @Column(nullable = false, unique = true)
    private String email;            // Email: NOT NULL + UNIQUE

    private String phone;            // Số điện thoại (có thể null)

    @Enumerated(EnumType.STRING)     // Lưu enum dưới dạng chuỗi ("ROLE_USER", "ROLE_ADMIN")
    @Column(length = 20)
    private Role role;               // Vai trò: ROLE_USER hoặc ROLE_ADMIN
}
```

### 4.2 `Role.java` - Enum vai trò

```java
public enum Role {
    ROLE_USER,    // Người dùng thường
    ROLE_ADMIN    // Quản trị viên
}
```

### 4.3 `Event.java` - Bảng sự kiện

```java
@Entity
@Table(name = "events")
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;               // Tên sự kiện (bắt buộc)

    private String imageUrl;           // Ảnh đại diện sự kiện

    @ElementCollection                 // Lưu danh sách ảnh phụ trong bảng riêng "event_images"
    @CollectionTable(name = "event_images", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "image_url")
    private List<String> additionalImages;  // Danh sách ảnh bổ sung

    @Column(columnDefinition = "TEXT") // Kiểu TEXT cho phép lưu mô tả dài
    private String description;

    @Column(nullable = false)
    private LocalDateTime startTime;   // Thời gian bắt đầu sự kiện

    private String location;           // Địa điểm
    private String type;               // Loại: CONCERT, FOOTBALL,...
    private String organizerName;      // Tên đơn vị tổ chức

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // ↑ Quan hệ 1-N với TicketType. cascade=ALL: thao tác với Event sẽ cascade xuống TicketType
    // ↑ LAZY: chỉ load TicketType khi thực sự cần (tối ưu hiệu năng)
    private List<TicketType> ticketTypes;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EventStatus status = EventStatus.APPROVED;  // Mặc định: APPROVED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id")
    private User organizer;            // Người tổ chức (FK đến bảng users)
}
```

### 4.4 `TicketType.java` - Loại vé

```java
public class TicketType {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;               // Thuộc sự kiện nào (FK)

    @Column(nullable = false)
    private String zoneName;           // Tên khu vực: "VIP", "Thường",...

    @Column(nullable = false)
    private BigDecimal price;          // Giá vé (dùng BigDecimal cho chính xác tiền tệ)

    @Column(nullable = false)
    private Integer totalQuantity;     // Tổng số vé

    @Column(nullable = false)
    private Integer remainingQuantity; // Số vé còn lại

    @Version
    private Long version;
    // ↑ OPTIMISTIC LOCKING: Khi 2 người mua vé cùng lúc,
    //   Spring sẽ kiểm tra version. Nếu version đã thay đổi → ném lỗi
    //   Ngăn chặn race condition (bán quá số vé)
}
```

### 4.5 `Booking.java` - Đơn đặt vé

```java
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;                 // Người đặt vé

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;               // Sự kiện được đặt

    @Column(nullable = false)
    private LocalDateTime bookingTime; // Thời điểm đặt vé

    @Enumerated(EnumType.STRING)
    private BookingStatus status;      // PENDING → PAID / CANCELLED

    @Column(nullable = false)
    private BigDecimal totalAmount;    // Tổng tiền

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BookingDetail> bookingDetails;  // Chi tiết đặt vé
}
```

### 4.6 `BookingDetail.java` - Chi tiết đặt vé

```java
public class BookingDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;           // Thuộc đơn đặt nào

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_type_id", nullable = false)
    private TicketType ticketType;     // Loại vé đã chọn

    @Column(nullable = false)
    private Integer quantity;          // Số lượng vé đặt

    @Column(nullable = false)
    private BigDecimal price;          // Giá tại thời điểm đặt (snapshot giá)

    @OneToMany(mappedBy = "bookingDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Ticket> tickets;      // Danh sách vé điện tử
}
```

### 4.7 `Ticket.java` - Vé điện tử

```java
public class Ticket {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String ticketCode;         // Mã vé duy nhất, VD: "VNT-A1B2C3D4"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_detail_id", nullable = false)
    private BookingDetail bookingDetail;

    @Enumerated(EnumType.STRING)
    private TicketStatus status;       // VALID / USED / CANCELLED
}
```

### 4.8 Các Enum trạng thái

```java
// Trạng thái đơn đặt vé
enum BookingStatus { PENDING, PAID, CANCELLED }

// Trạng thái sự kiện
enum EventStatus { PENDING, APPROVED, REJECTED }

// Trạng thái vé điện tử
enum TicketStatus { VALID, USED, CANCELLED }
```

---

## 5. REPOSITORY - TRUY VẤN DATABASE

Repository kế thừa `JpaRepository` → tự động có các method CRUD cơ bản (`save`, `findById`, `findAll`, `delete`,...).

### 5.1 `UserRepository.java`

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    // ↑ Spring Data tự sinh query: SELECT * FROM users WHERE username = ?

    Boolean existsByUsername(String username);
    // ↑ SELECT COUNT(*) > 0 FROM users WHERE username = ?

    Boolean existsByEmail(String email);
    // ↑ Kiểm tra email đã tồn tại chưa
}
```

### 5.2 `EventRepository.java`

```java
public interface EventRepository extends JpaRepository<Event, Long> {
    // Tìm event theo loại (không phân biệt hoa thường)
    Page<Event> findByTypeContainingIgnoreCase(String type, Pageable pageable);

    // Tìm kiếm full-text theo tên hoặc loại
    @Query("SELECT e FROM Event e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.type) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Event> searchEvents(@Param("keyword") String keyword, Pageable pageable);

    // Lọc event theo trạng thái (VD: chỉ APPROVED)
    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    // Tìm kiếm + lọc theo status
    Page<Event> searchEventsByStatus(String keyword, EventStatus status, Pageable pageable);

    // Lấy event của 1 organizer cụ thể
    List<Event> findByOrganizerId(Long organizerId);
}
```

### 5.3 `BookingRepository.java`

```java
public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Lấy danh sách booking của user, sắp xếp mới nhất trước
    List<Booking> findByUserIdOrderByBookingTimeDesc(Long userId);

    // Tìm booking PENDING đã quá hạn (dùng cho auto-cancel)
    List<Booking> findByStatusAndBookingTimeBefore(BookingStatus status, LocalDateTime time);

    // Đếm booking theo trạng thái (cho thống kê)
    long countByStatus(BookingStatus status);
    long countByEventIdAndStatus(Long eventId, BookingStatus status);
    long countByEventId(Long eventId);

    // Tính tổng doanh thu (SUM totalAmount WHERE status = PAID)
    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.status = :status")
    BigDecimal sumTotalAmountByStatus(@Param("status") BookingStatus status);
    // ↑ COALESCE: nếu SUM = null (không có booking) → trả về 0

    // Tổng vé đã bán (JOIN BookingDetail để SUM quantity)
    @Query("SELECT COALESCE(SUM(bd.quantity), 0) FROM BookingDetail bd " +
           "JOIN bd.booking b WHERE b.status IN :statuses")
    long sumTicketsByStatuses(@Param("statuses") List<BookingStatus> statuses);
}
```

---

## 6. DTO - ĐỐI TƯỢNG TRUYỀN DỮ LIỆU

DTO tách biệt Entity (DB) khỏi API response, chỉ gửi data cần thiết cho client.

### 6.1 Request DTOs (Client → Server)

```java
// Đăng nhập
public class LoginRequest {
    @NotBlank private String username;  // Bắt buộc, không trống
    @NotBlank private String password;
}

// Đăng ký
public class SignupRequest {
    @NotBlank private String username;
    @NotBlank private String password;
    @NotBlank private String fullName;
    @NotBlank @Email private String email;  // Phải đúng format email
    private String phone;                    // Không bắt buộc
}

// Đặt vé
public class BookingRequest {
    @NotNull private Long eventId;         // ID sự kiện
    @NotNull private Long ticketTypeId;    // ID loại vé
    @NotNull @Min(1) private Integer quantity;  // Số lượng >= 1
}

// Cập nhật thông tin cá nhân
public class UserProfileUpdateRequest {
    private String fullName;
    @NotBlank @Email private String email;
    private String phone;
}
```

### 6.2 Response DTOs (Server → Client)

```java
// Bọc mọi response theo format thống nhất
public class ApiResponse<T> {
    private int status;      // HTTP status code (200, 400, 404,...)
    private String message;  // Thông báo
    private T data;          // Dữ liệu trả về (generic type)

    // Factory method cho trường hợp thành công
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(200, message, data);
    }
    // Factory method cho trường hợp lỗi
    public static <T> ApiResponse<T> error(int status, String message) {
        return new ApiResponse<>(status, message, null);
    }
}

// Response sau khi đăng nhập
public class JwtResponse {
    private String token;           // Access Token (JWT)
    private String type = "Bearer"; // Loại token
    private Long id;                // User ID
    private String username;
    private String email;
    private String role;            // "ROLE_USER" hoặc "ROLE_ADMIN"
}
```

---

## 7. SECURITY - BẢO MẬT & JWT

### 7.1 Luồng xử lý bảo mật cho MỌI request:

```
Client Request
      │
      ▼
┌─────────────────┐   Không có token    ┌──────────────┐
│ AuthTokenFilter │ ───────────────────→│ Kiểm tra URL │
│ (JWT Filter)    │                     │ có public?   │
│                 │   Có token          └──────┬───────┘
│ parseJwt()      │◄──┐                   Yes │    No
│ validateToken() │   │                       ▼       ▼
│ setAuth()       │   │                   ✅ Cho qua  ❌ 401
└─────────────────┘   │
      │ Token hợp lệ  │
      ▼               │
  SecurityContext      │
  (user đã xác thực)   │
      │               │
      ▼               │
  Controller xử lý ◄──┘
```

### 7.2 `WebSecurityConfig.java` - Cấu hình bảo mật

```java
@Configuration          // Đánh dấu đây là class cấu hình
@EnableMethodSecurity   // Cho phép dùng @PreAuthorize trên từng method
public class WebSecurityConfig {

    // Tạo bean JWT Filter
    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();  // Filter sẽ chạy trước mọi request
    }

    // Cấu hình cách xác thực: dùng UserDetailsService + BCrypt
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);  // Tìm user từ DB
        authProvider.setPasswordEncoder(passwordEncoder());       // So sánh password BCrypt
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();  // Mã hóa password bằng BCrypt
    }

    // CẤU HÌNH CHÍNH: Quy tắc bảo mật
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())           // Tắt CSRF (vì dùng JWT, không dùng session)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))  // Cho phép CORS
            .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
            // ↑ Khi chưa xác thực mà truy cập API protected → trả JSON lỗi 401
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // ↑ STATELESS: không tạo session, mỗi request phải gửi JWT
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()    // API auth: ai cũng truy cập được
                .requestMatchers("/api/events/**").permitAll()  // API xem event: public
                .requestMatchers("/api/admin/**").hasRole("ADMIN")  // API admin: chỉ ADMIN
                .anyRequest().authenticated()                   // Còn lại: phải đăng nhập
            );

        // Thêm JWT Filter VÀO TRƯỚC UsernamePasswordAuthenticationFilter
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // Cấu hình CORS: chỉ cho phép frontend (localhost:5175)
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5175"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);  // Cho phép gửi cookie (refresh token)
        // ...
    }
}
```

### 7.3 `AuthTokenFilter.java` - Bộ lọc JWT

```java
// Kế thừa OncePerRequestFilter: chạy DUY NHẤT 1 lần cho mỗi request
public class AuthTokenFilter extends OncePerRequestFilter {
    @Autowired private JwtUtils jwtUtils;
    @Autowired private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) {
        try {
            // Bước 1: Trích xuất JWT từ header "Authorization: Bearer eyJhbG..."
            String jwt = parseJwt(request);

            // Bước 2: Nếu có token VÀ token hợp lệ (chưa hết hạn, chữ ký đúng)
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                // Bước 3: Lấy username từ token
                String username = jwtUtils.getUserNameFromJwtToken(jwt);

                // Bước 4: Load thông tin user từ DB
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Bước 5: Tạo Authentication object và đặt vào SecurityContext
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
                // → Từ đây, mọi nơi trong app đều biết user hiện tại là ai
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        // Bước 6: Cho request đi tiếp (dù có token hay không)
        filterChain.doFilter(request, response);
    }

    // Trích xuất token: "Bearer eyJhbG..." → "eyJhbG..."
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);  // Cắt bỏ "Bearer " (7 ký tự)
        }
        return null;
    }
}
```

### 7.4 `JwtUtils.java` - Tiện ích JWT

```java
@Component
public class JwtUtils {
    @Value("${app.jwt.secret}")       // Đọc secret key từ application.yml
    private String jwtSecret;

    @Value("${app.jwt.expirationMs}") // Thời gian hết hạn: 600000ms = 10 phút
    private int jwtExpirationMs;

    // Tạo signing key từ secret string
    private Key key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());  // HMAC-SHA key
    }

    // Tạo JWT token từ Authentication (sau khi đăng nhập)
    public String generateJwtToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())  // Subject = username
                .setIssuedAt(new Date())                  // Thời điểm tạo
                .setExpiration(new Date(new Date().getTime() + jwtExpirationMs))  // Hết hạn
                .signWith(key(), SignatureAlgorithm.HS256) // Ký bằng HS256
                .compact();                                // Build thành chuỗi JWT
    }

    // Giải mã token → lấy username
    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    // Kiểm tra token có hợp lệ không
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parse(authToken);
            return true;
        } catch (MalformedJwtException e) { /* Token sai format */ }
          catch (ExpiredJwtException e) { /* Token hết hạn */ }
          // ... các exception khác
        return false;
    }
}
```

### 7.5 `UserDetailsImpl.java` - Adapter User cho Spring Security

```java
// Bọc entity User thành UserDetails (interface mà Spring Security yêu cầu)
public class UserDetailsImpl implements UserDetails {
    private Long id;
    private String username;
    private String email;
    @JsonIgnore private String password;  // Không serialize password ra JSON
    private Collection<? extends GrantedAuthority> authorities;

    // Factory method: chuyển User entity → UserDetailsImpl
    public static UserDetailsImpl build(User user) {
        // Chuyển Role enum → GrantedAuthority (Spring Security dùng để check quyền)
        List<GrantedAuthority> authorities = List.of(
            new SimpleGrantedAuthority(user.getRole().name())  // VD: "ROLE_USER"
        );
        return new UserDetailsImpl(user.getId(), user.getUsername(),
                                    user.getEmail(), user.getPassword(), authorities);
    }

    // Tất cả method isXxxNonXxx() trả về true → tài khoản luôn active
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
```

### 7.6 `RefreshTokenService.java` - Quản lý Refresh Token bằng Redis

```java
@Service
public class RefreshTokenService {
    private static final String REFRESH_TOKEN_PREFIX = "refresh:";
    // ↑ Key trong Redis sẽ có dạng: "refresh:abc-123-def-456"

    @Value("${app.jwt.jwtRefreshExpirationMs}")
    private Long refreshTokenDurationMs;   // 30 ngày

    private final StringRedisTemplate redisTemplate;  // Client Redis

    // TẠO refresh token mới
    public String createRefreshToken(Long userId) {
        String token = UUID.randomUUID().toString();     // Sinh chuỗi ngẫu nhiên
        String key = REFRESH_TOKEN_PREFIX + token;       // VD: "refresh:abc-123"

        // Lưu vào Redis: KEY="refresh:abc-123", VALUE="42" (userId), TTL=30 ngày
        redisTemplate.opsForValue().set(key, String.valueOf(userId),
                refreshTokenDurationMs, TimeUnit.MILLISECONDS);
        // ↑ Redis tự xóa key sau 30 ngày (TTL)

        return token;  // Trả token string cho client (lưu trong cookie)
    }

    // TÌM userId từ refresh token
    public Optional<Long> findUserIdByToken(String token) {
        String key = REFRESH_TOKEN_PREFIX + token;
        String userIdStr = redisTemplate.opsForValue().get(key);
        if (userIdStr == null) return Optional.empty();  // Token hết hạn hoặc không tồn tại
        return Optional.of(Long.parseLong(userIdStr));
    }

    // XÓA refresh token (khi đăng xuất)
    public boolean deleteByToken(String token) {
        String key = REFRESH_TOKEN_PREFIX + token;
        return Boolean.TRUE.equals(redisTemplate.delete(key));
    }
}
```

---

## 8. LUỒNG XÁC THỰC (AUTH FLOW)

### 8.1 Đăng ký - `POST /api/auth/register`

```
Client                    AuthController              AuthServiceImpl              UserRepository
  │                            │                           │                           │
  │──POST /register───────────→│                           │                           │
  │  {username, password,...}   │                           │                           │
  │                            │──registerUser()──────────→│                           │
  │                            │                           │──existsByUsername()───────→│
  │                            │                           │←────false─────────────────│
  │                            │                           │──existsByEmail()──────────→│
  │                            │                           │←────false─────────────────│
  │                            │                           │  BCrypt.encode(password)   │
  │                            │                           │  User.builder()...build()  │
  │                            │                           │──save(user)───────────────→│
  │                            │                           │←────saved────────────────│
  │                            │←──────────────────────────│                           │
  │←──200 OK──────────────────│                           │                           │
  │  "User registered!"       │                           │                           │
```

**`AuthServiceImpl.registerUser()` chi tiết:**
1. Kiểm tra username đã tồn tại → nếu có, throw `BadRequestException`
2. Kiểm tra email đã tồn tại → nếu có, throw `BadRequestException`
3. Mã hóa password bằng BCrypt: `encoder.encode(password)`
4. Tạo User với role mặc định `ROLE_USER`
5. Lưu vào PostgreSQL

### 8.2 Đăng nhập - `POST /api/auth/login`

```
Client                  AuthController        AuthServiceImpl       RefreshTokenService    Redis
  │                          │                      │                      │                 │
  │──POST /login────────────→│                      │                      │                 │
  │  {username, password}    │──authenticateUser()──→│                      │                 │
  │                          │                      │  authManager          │                 │
  │                          │                      │  .authenticate()      │                 │
  │                          │                      │  (kiểm tra password)  │                 │
  │                          │                      │  generateJwtToken()   │                 │
  │                          │                      │  → accessToken        │                 │
  │                          │←─────JwtResponse─────│                      │                 │
  │                          │                      │                      │                 │
  │                          │──createRefreshToken()───────────────────────→│                 │
  │                          │                      │                      │──SET key TTL────→│
  │                          │←─────refreshToken────────────────────────────│                 │
  │                          │                      │                      │                 │
  │←──200 OK────────────────│                      │                      │                 │
  │  Body: {token, id, ...}  │                      │                      │                 │
  │  Cookie: vnticket-refresh│                      │                      │                 │
```

**Chi tiết:**
1. `AuthenticationManager.authenticate()`: kiểm tra username/password bằng `UserDetailsServiceImpl`
2. Nếu đúng → lưu Authentication vào SecurityContext
3. Tạo JWT AccessToken (hết hạn 10 phút)
4. Tạo Refresh Token → lưu vào Redis (TTL 30 ngày)
5. Trả access token trong response body
6. Trả refresh token trong **HttpOnly cookie** (bảo mật, JS không đọc được)

### 8.3 Refresh Token - `POST /api/auth/refreshtoken`

```
Client                  AuthController        RefreshTokenService    UserRepository
  │                          │                      │                     │
  │──POST /refreshtoken─────→│                      │                     │
  │  Cookie: vnticket-refresh│                      │                     │
  │                          │──findUserIdByToken()─→│                     │
  │                          │                      │──GET from Redis     │
  │                          │←────userId───────────│                     │
  │                          │──findById(userId)──────────────────────────→│
  │                          │←────User───────────────────────────────────│
  │                          │  generateTokenFromUsername()                │
  │                          │  → new accessToken                         │
  │←──200 OK────────────────│                                            │
  │  {new accessToken, ...}  │                                            │
```

**Mục đích**: Khi access token hết hạn (10 phút), client gọi API này để lấy token mới mà không cần đăng nhập lại.

### 8.4 Đăng xuất - `POST /api/auth/logout`

1. Đọc refresh token từ cookie
2. Xóa key tương ứng trong Redis (`redisTemplate.delete()`)
3. Xóa cookie trên trình duyệt (set maxAge = 0)
4. → Client không còn refresh token → phải đăng nhập lại

---

## 9. LUỒNG QUẢN LÝ SỰ KIỆN (EVENT FLOW)

### 9.1 Xem danh sách sự kiện (Public) - `GET /api/events`

```
Client                EventController              EventServiceImpl           EventRepository
  │                        │                             │                         │
  │──GET /api/events──────→│                             │                         │
  │  ?type=CONCERT         │──getApprovedEvents()───────→│                         │
  │  &search=abc           │                             │                         │
  │  &page=0&size=10       │                             │  Kiểm tra tham số:      │
  │                        │                             │  - Có search? → search  │
  │                        │                             │  - Có type? → filter    │
  │                        │                             │  - Không có? → findAll  │
  │                        │                             │──query DB───────────────→│
  │                        │                             │←──Page<Event>───────────│
  │                        │                             │  mapToDto()              │
  │                        │←──Page<EventDto>────────────│                         │
  │←──200 OK──────────────│                             │                         │
```

**Logic chọn query trong `getApprovedEvents()`:**
- Nếu có `search` → tìm theo tên hoặc loại event (chỉ APPROVED)
- Nếu có `type` → lọc theo loại event (chỉ APPROVED)
- Nếu không có gì → lấy tất cả event APPROVED
- Kết quả luôn phân trang (`Pageable`)

### 9.2 Tạo sự kiện (User) - `POST /api/events/my`

1. Lấy `userId` từ SecurityContext (user đang đăng nhập)
2. Tạo Event với status = `PENDING` (chờ admin duyệt)
3. Gán `organizer = user`
4. Lưu Event + các TicketType kèm theo

### 9.3 Tạo sự kiện (Admin) - `POST /api/admin/events`

1. Tạo Event với status = `APPROVED` (tự động duyệt)
2. Không cần organizer
3. Lưu Event + TicketType

### 9.4 Cập nhật trạng thái event (Admin) - `PUT /api/admin/events/{id}/status`

Admin duyệt/từ chối sự kiện: `PENDING → APPROVED` hoặc `PENDING → REJECTED`

---

## 10. LUỒNG ĐẶT VÉ (BOOKING FLOW) ⭐

Đây là luồng **phức tạp nhất** của hệ thống:

### 10.1 Đặt vé - `POST /api/bookings`

```
Client              BookingController          BookingServiceImpl         Repository
  │                       │                          │                       │
  │──POST /api/bookings──→│                          │                       │
  │  {eventId, ticketTypeId, quantity}               │                       │
  │                       │──bookTicket(userId, req)─→│                       │
  │                       │                          │                       │
  │                       │          ┌───────────────┤                       │
  │                       │          │ BƯỚC 1: Validate                      │
  │                       │          │ - findById(userId) → User             │
  │                       │          │ - findById(eventId) → Event           │
  │                       │          │ - findById(ticketTypeId) → TicketType │
  │                       │          │ - Kiểm tra ticketType thuộc event?    │
  │                       │          │ - Kiểm tra remainingQuantity >= qty?  │
  │                       │          ├───────────────┤                       │
  │                       │          │ BƯỚC 2: Giảm số vé                    │
  │                       │          │ remaining -= quantity                  │
  │                       │          │ ticketTypeRepo.save() ← @Version check│
  │                       │          ├───────────────┤                       │
  │                       │          │ BƯỚC 3: Tạo Booking                   │
  │                       │          │ status = PENDING                      │
  │                       │          │ totalAmount = price * quantity         │
  │                       │          ├───────────────┤                       │
  │                       │          │ BƯỚC 4: Tạo BookingDetail             │
  │                       │          │ Lưu giá snapshot tại thời điểm đặt    │
  │                       │          ├───────────────┤                       │
  │                       │          │ BƯỚC 5: Sinh vé điện tử               │
  │                       │          │ VNT-{UUID 8 ký tự} × quantity vé      │
  │                       │          │ VD: "VNT-A1B2C3D4"                    │
  │                       │          │ status = VALID                        │
  │                       │          └───────────────┤                       │
  │                       │←──BookingDto─────────────│                       │
  │←──200 OK─────────────│                          │                       │
```

**Giải thích @Version (Optimistic Locking):**
- Khi 2 người mua vé cùng lúc cho cùng 1 TicketType
- Người A đọc version=1, remaining=10 → cập nhật remaining=8, version=2
- Người B cũng đọc version=1, remaining=10 → cố cập nhật → Spring phát hiện version đã thay đổi → ném `ObjectOptimisticLockingFailureException`
- → Trả lỗi 409: "Tickets have been modified by another user"

### 10.2 Thanh toán giả lập - `PUT /api/bookings/{id}/pay-mock`

1. Kiểm tra booking thuộc user hiện tại
2. Kiểm tra status == PENDING
3. **Kiểm tra thời gian**: nếu quá 15 phút từ lúc đặt → tự động hủy booking + hoàn vé
4. Nếu hợp lệ → chuyển status thành `PAID`

### 10.3 Hủy booking - `PUT /api/bookings/{id}/cancel`

1. Kiểm tra booking thuộc user
2. Không cho hủy nếu đã `PAID` hoặc đã `CANCELLED`
3. Chuyển status → `CANCELLED`
4. **Hoàn vé**: `remainingQuantity += quantity` cho từng BookingDetail
5. Hủy vé điện tử: set status = `CANCELLED`

### 10.4 Auto-cancel booking hết hạn (Scheduler)

```java
// BookingCleanupTask.java - Chạy mỗi 60 giây
@Scheduled(fixedRate = 60000)
public void cleanupExpiredBookings() {
    bookingService.cancelExpiredBookings();
}

// BookingServiceImpl.cancelExpiredBookings()
public void cancelExpiredBookings() {
    // Tìm booking PENDING mà đã đặt > 15 phút
    LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(15);
    List<Booking> expired = bookingRepository
        .findByStatusAndBookingTimeBefore(BookingStatus.PENDING, expiryTime);

    for (Booking booking : expired) {
        booking.setStatus(BookingStatus.CANCELLED);
        // Hoàn vé cho từng BookingDetail
        for (BookingDetail detail : booking.getBookingDetails()) {
            ticketType.setRemainingQuantity(remaining + detail.getQuantity());
            // Hủy vé điện tử
            detail.getTickets().forEach(t -> t.setStatus(TicketStatus.CANCELLED));
        }
    }
    bookingRepository.saveAll(expired);
}
```

---

## 11. LUỒNG QUẢN LÝ USER

### `GET /api/users/me` - Xem thông tin cá nhân

1. Lấy user từ SecurityContext → query DB
2. Chuyển User entity → UserDto (không chứa password)
3. Trả về

### `PUT /api/users/me` - Cập nhật thông tin

1. Kiểm tra email mới có trùng user khác không
2. Cập nhật fullName, email, phone
3. Lưu DB

---

## 12. SCHEDULER - TÁC VỤ TỰ ĐỘNG

### `BookingCleanupTask.java`

```java
@Component
public class BookingCleanupTask {
    @Scheduled(fixedRate = 60000)  // Chạy mỗi 60 giây
    public void cleanupExpiredBookings() {
        // Gọi service để tự động hủy booking PENDING quá 15 phút
        bookingService.cancelExpiredBookings();
    }
}
```

**Hoạt động nhờ** `@EnableScheduling` trong `VnTicketApplication.java`

---

## 13. EXCEPTION HANDLING

### `GlobalExceptionHandler.java` - Xử lý lỗi toàn cục

```java
@ControllerAdvice  // Bắt exception từ TẤT CẢ controller
public class GlobalExceptionHandler {

    // 404 - Không tìm thấy resource
    @ExceptionHandler(ResourceNotFoundException.class)
    → status: 404, message: "Event/User/Booking not found"

    // 400 - Request không hợp lệ
    @ExceptionHandler(BadRequestException.class)
    → status: 400, message: "Not enough tickets", "Username already taken",...

    // 400 - Validation thất bại (@NotBlank, @Email,...)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    → status: 400, message: "email: must be valid, username: must not be blank"

    // 409 - Race condition (2 người mua cùng lúc)
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    → status: 409, message: "Tickets modified by another user. Please try again."

    // 401 - Sai username/password
    @ExceptionHandler(BadCredentialsException.class)
    → status: 401, message: "Tài khoản hoặc mật khẩu không chính xác!"

    // 403 - Refresh token hết hạn
    @ExceptionHandler(TokenRefreshException.class)
    → status: 403, message: "Refresh token không tồn tại hoặc đã hết hạn!"

    // 500 - Lỗi không xác định
    @ExceptionHandler(Exception.class)
    → status: 500, message: "Internal Server Error: ..."
}
```

### `AuthEntryPointJwt.java` - Xử lý truy cập không xác thực

```java
// Khi user chưa đăng nhập mà truy cập API protected
// Spring Security gọi hàm commence() này
// → Trả về JSON 401 thay vì redirect trang login (vì đây là REST API)
@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                          AuthenticationException authException) {
        response.setStatus(401);
        // Trả JSON: {"status": 401, "error": "Unauthorized", "message": "...", "path": "/api/..."}
    }
}
```

---

## 📊 TỔNG KẾT CẤU TRÚC FILE

| Package | File | Chức năng |
|---------|------|-----------|
| **root** | `VnTicketApplication.java` | Điểm khởi chạy ứng dụng |
| **entity** | `User`, `Event`, `TicketType`, `Booking`, `BookingDetail`, `Ticket` | Ánh xạ bảng DB |
| **entity** | `Role`, `BookingStatus`, `EventStatus`, `TicketStatus` | Enum trạng thái |
| **controller** | `AuthController` | API đăng nhập/đăng ký/logout |
| **controller** | `EventController` | API CRUD sự kiện |
| **controller** | `BookingController` | API đặt vé/thanh toán/hủy |
| **controller** | `UserController` | API thông tin cá nhân |
| **service** | `AuthService` → `AuthServiceImpl` | Logic xác thực |
| **service** | `EventService` → `EventServiceImpl` | Logic quản lý event |
| **service** | `BookingService` → `BookingServiceImpl` | Logic đặt vé |
| **repository** | `UserRepo`, `EventRepo`, `BookingRepo`,... | Truy vấn DB |
| **security** | `WebSecurityConfig` | Cấu hình bảo mật |
| **security/jwt** | `JwtUtils`, `AuthTokenFilter`, `AuthEntryPointJwt` | Xử lý JWT |
| **security/services** | `UserDetailsImpl`, `UserDetailsServiceImpl`, `RefreshTokenService` | Service bảo mật |
| **exception** | `GlobalExceptionHandler`, `BadRequest`, `ResourceNotFound`, `TokenRefresh` | Xử lý lỗi |
| **scheduler** | `BookingCleanupTask` | Tự động hủy booking hết hạn |
| **dto** | Request/Response DTOs | Đối tượng trả về API |
