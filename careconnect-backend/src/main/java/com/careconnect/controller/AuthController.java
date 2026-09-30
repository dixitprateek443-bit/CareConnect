package com.careconnect.controller;

import com.careconnect.dto.AuthRequest;
import com.careconnect.dto.AuthResponse;
import com.careconnect.dto.ForgotPasswordRequest;
import com.careconnect.dto.RegisterRequest;
import com.careconnect.dto.ResetPasswordRequest;
import com.careconnect.service.AuthService;
import com.careconnect.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Step 1 — Request OTP for password reset.
     * Accepts email or mobile number as identifier.
     * Returns masked contact info + OTP (demo mode, no email server).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            PasswordResetService.OtpResult result = passwordResetService.requestReset(request.getIdentifier());
            return ResponseEntity.ok(Map.of(
                "success",     true,
                "message",     "OTP sent successfully",
                "email",       result.email(),
                "maskedEmail", result.maskedEmail(),
                "maskedPhone", result.maskedPhone() != null ? result.maskedPhone() : "—",
                "userName",    result.userName(),
                // Demo only — in production, remove this and send via email/SMS
                "demoOtp",     result.otp()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Step 2 — Reset password using OTP.
     * Verifies the OTP and updates the password in the database.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Password updated successfully. You can now sign in with your new password."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "CareConnect Auth Module",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
