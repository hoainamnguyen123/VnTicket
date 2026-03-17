# 🎫 GIẢI THÍCH CHI TIẾT TÍCH HỢP ĐĂNG NHẬP GOOGLE (OAUTH2)

Tài liệu này giải thích chi tiết cách thức hoạt động, luồng xử lý và ý nghĩa từng đoạn code trong việc tích hợp đăng nhập Google vào hệ thống VNTicket.

---

## 1. LUỒNG XỬ LÝ TỔNG QUAN (WORKFLOW)

Chúng ta sử dụng giải pháp **Google Identity Services (GIS)** với luồng **ID Token Validation**:

1.  **Frontend**: Hiển thị nút "Sign in with Google". Khi user click và chọn tài khoản, Google trả về một chuỗi mã hóa gọi là `idToken` (JSON Web Token - JWT).
2.  **Frontend → Backend**: Frontend gửi `idToken` này lên API `/api/auth/google`.
3.  **Backend**: 
    *   Sử dụng thư viện của Google để giải mã và xác thực `idToken` (kiểm tra chữ ký, thời hạn, và Client ID).
    *   Lấy thông tin email, tên, và mã định danh duy nhất của Google (`sub` - mã này không bao giờ thay đổi dù user đổi email).
    *   Kiểm tra DB: 
        *   Nếu đã có user khớp với mã Google ID này → Đăng nhập.
        *   Nếu chưa có Google ID nhưng có Email trùng → Liên kết tài khoản cũ với Google ID mới → Đăng nhập.
        *   Nếu hoàn toàn mới → Tự động tạo tài khoản (password ngẫu nhiên) → Đăng nhập.
    *   Trả về Access Token (JWT của app) và Cookie Refresh Token như login bình thường.

---

## 2. CHI TIẾT CODE PHÍA BACKEND

### 2.1 Cấu hình & Dependency

#### File: `pom.xml`
```xml
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>
```
> **Giải thích**: Thư viện chính thức của Google giúp verify (xác thực) token từ Google gửi về. Nếu không có cái này, backend sẽ không biết token frontend gửi là thật hay giả.

#### File: `application.yml`
```yaml
app:
  google:
    clientId: 626920740184-...apps.googleusercontent.com
```
> **Giải thích**: Lưu Client ID để backend biết nó đang phục vụ ứng dụng nào trên Google Cloud.

---

### 2.2 Entity & DTO

#### File: `User.java`
```java
private String googleId; // Lưu mã định danh duy nhất của Google
@Column(nullable = true)
private String password; // Password giờ có thể để trống (vì user Google login không cần pass)
```

#### File: `GoogleLoginRequest.java`
```java
public class GoogleLoginRequest {
    @NotBlank
    private String idToken; // Payload nhận từ frontend
}
```

---

### 2.3 Xử lý Logic (Service Layer)

#### File: `AuthServiceImpl.java` (Phương thức `authenticateGoogleUser`)

**Bước 1: Xác thực Token với Google**
```java
GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
        new NetHttpTransport(), GsonFactory.getDefaultInstance())
        .setAudience(Collections.singletonList(googleClientId))
        .build();

GoogleIdToken idToken = verifier.verify(idTokenString);
```
> **Dòng này làm gì?**: Nó gọi lên máy chủ Google để check xem chuỗi `idToken` kia có phải do chính Google ký phát không. Nếu ai đó gửi token giả, nó sẽ ném lỗi ngay.

**Bước 2: Lấy thông tin user**
```java
GoogleIdToken.Payload payload = idToken.getPayload();
String googleId = payload.getSubject(); // Đây là mã duy nhất (ví dụ: "105...95")
String email = payload.getEmail();
String fullName = (String) payload.get("name");
```

**Bước 3: Tìm kiếm hoặc Tạo mới User (Logic quan trọng)**
```java
User user = userRepository.findByGoogleId(googleId) // Ưu tiên tìm theo Google ID
    .orElseGet(() -> userRepository.findByEmail(email) // Nếu không thấy, tìm theo Email (user đã có tài khoản thường)
        .map(existingUser -> {
            existingUser.setGoogleId(googleId); // "Gắn" Google ID vào tài khoản cũ để lần sau vào thẳng
            return userRepository.save(existingUser);
        })
        .orElseGet(() -> { // Hoàn toàn mới -> Tạo tài khoản tự động
            String username = email.split("@")[0]; // Lấy phần trước @ làm username
            // ... (check trùng username) ...
            User newUser = User.builder()
                    .username(username)
                    .email(email)
                    .password(encoder.encode(UUID.randomUUID().toString())) // Tạo pass random cực mạnh (user không biết)
                    .googleId(googleId)
                    .role(Role.ROLE_USER)
                    .build();
            return userRepository.save(newUser);
        }));
```
> **Ý nghĩa**: Đảm bảo trải nghiệm mượt mà. User cũ đăng nhập Google vẫn vào đúng account cũ, user mới thì vào cực nhanh không cần điền form.

---

### 2.4 Controller Layer

#### File: `AuthController.java` (Endpoint `/google`)
```java
@PostMapping("/google")
public ResponseEntity<ApiResponse<JwtResponse>> googleLogin(...) {
    JwtResponse jwtResponse = authService.authenticateGoogleUser(request.getIdToken());
    String refreshTokenStr = refreshTokenService.createRefreshToken(jwtResponse.getId());
    // ... Trả về Set-Cookie cho Refresh Token ...
}
```
> **Dòng này làm gì?**: Sau khi login Google thành công, backend coi như user đã authenticated hợp lệ. Nó cấp "Visa" của hệ thống mình (JWT Access Token) để user dùng đi mua vé.

---

## 3. CHI TIẾT CODE PHÍA FRONTEND

### 3.1 Khai báo thư viện

#### File: `index.html`
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```
> **Giải thích**: Tải bộ SDK "Google Identity Services". Cái này tạo ra cửa sổ popup chọn tài khoản Google.

---

### 3.2 Tích hợp nút bấm

#### File: `Login.jsx` & `Register.jsx`

**Khởi tạo (useEffect):**
```javascript
window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCallback, // Hàm xử lý khi chọn tài khoản xong
});
window.google.accounts.id.renderButton(googleBtnRef.current, {
    theme: 'outline', size: 'large', width: '352' // Tùy chỉnh giao diện nút
});
```
> **Giải thích**: Đây là cách chuyên nghiệp nhất. Google sẽ tự vẽ nút (Button) chuẩn UI của họ vào thẻ `div` mà mình chỉ định.

**Xử lý kết quả (handleGoogleCallback):**
```javascript
const handleGoogleCallback = async (response) => {
    // response.credential chính là chuỗi idToken mã hóa
    const res = await axiosClient.post('/auth/google', {
        idToken: response.credential,
    });
    // Lưu token vào local và Context như bình thường
    login(userData, token);
};
```
> **Giải thích**: Khi user chọn xong tài khoản Google, Google gọi hàm này và đưa cho mình cái "Chìa khóa" (credential). Mình chỉ việc cầm chìa khóa đó ném lên Backend xử lý.

---

## 4. TẠI SAO CÁCH LÀM NÀY AN TOÀN?

1.  **Không lưu Password Google**: Chúng ta không bao giờ biết mật khẩu Google của user. Chỉ làm việc với Token Google cấp.
2.  **Xác thực phía Server**: Backend luôn gọi lại Google để check Token, không tin tưởng mù quáng vào dữ liệu từ trình duyệt gửi lên.
3.  **Mật khẩu của User Google**: Password lưu trong DB của chúng ta là chuỗi UUID ngẫu nhiên đã được mã hóa BCrypt. Kẻ xấu dù có vào được DB cũng không thể dùng mật khẩu đó để login (vì user cũng đâu có biết pass đó để mà nhập).
4.  **Optimistic UI**: User chỉ cần click và vào luôn, cực kỳ tăng tỷ lệ chuyển đổi (mua vé).

---
*Tài liệu được soạn bởi Antigravity Assistant.*
