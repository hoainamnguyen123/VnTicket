package com.vnticket.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu phải dài tối thiểu 8 ký tự")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).*$", message = "Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 chữ số")
    private String password;

    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    private String email;

    private String phone;
}
