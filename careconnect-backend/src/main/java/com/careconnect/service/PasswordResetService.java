package com.careconnect.service;

import com.careconnect.entity.User;
import com.careconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handles forgot-password OTP generation and verification.
 * OTPs are stored in-memory (no email server required for demo).
 * Each OTP expires after 10 minutes.
 */
@Service
public class PasswordResetService {

    private final UserRepository userRepository;

    // email → { otp, expiresAt }
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private static final long OTP_TTL_MS = 10 * 60 * 1000L; // 10 minutes

    public PasswordResetService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Find user by email or phone, generate OTP and store it */
    public OtpResult requestReset(String identifier) {
        String normalized = identifier.trim().toLowerCase();

        // Try email first, then phone
        Optional<User> userOpt = userRepository.findByEmail(normalized);
        if (userOpt.isEmpty()) {
            // try raw phone (not lowercased)
            userOpt = userRepository.findByPhone(identifier.trim());
        }

        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(
                "No account found with that email or mobile number. Please check and try again."
            );
        }

        User user = userOpt.get();
        String otp = String.format("%06d", new Random().nextInt(999999));
        long expiresAt = Instant.now().toEpochMilli() + OTP_TTL_MS;

        otpStore.put(user.getEmail(), new OtpEntry(otp, expiresAt));

        // Mask email and phone for display
        String maskedEmail = maskEmail(user.getEmail());
        String maskedPhone = maskPhone(user.getPhone());

        return new OtpResult(user.getEmail(), maskedEmail, maskedPhone, otp, user.getName());
    }

    /** Verify OTP for an email */
    public void verifyOtp(String email, String otp) {
        OtpEntry entry = otpStore.get(email.trim().toLowerCase());
        if (entry == null) {
            throw new IllegalArgumentException("No reset request found. Please request a new OTP.");
        }
        if (Instant.now().toEpochMilli() > entry.expiresAt()) {
            otpStore.remove(email);
            throw new IllegalArgumentException("OTP has expired. Please request a new one.");
        }
        if (!entry.otp().equals(otp.trim())) {
            throw new IllegalArgumentException("Incorrect OTP. Please check and try again.");
        }
    }

    /** Verify OTP then update password */
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        verifyOtp(email, otp);

        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
            .orElseThrow(() -> new IllegalArgumentException("Account not found."));

        user.setPassword(newPassword);
        userRepository.save(user);
        otpStore.remove(email.trim().toLowerCase());
    }

    // ---- helpers ----

    private String maskEmail(String email) {
        if (email == null) return "—";
        int at = email.indexOf('@');
        if (at <= 1) return email;
        String local = email.substring(0, at);
        String domain = email.substring(at);
        String visible = local.length() > 3
            ? local.substring(0, 2) + "*".repeat(local.length() - 3) + local.charAt(local.length() - 1)
            : local.charAt(0) + "*".repeat(local.length() - 1);
        return visible + domain;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return phone;
        return "***-***-" + phone.substring(phone.length() - 4);
    }

    // ---- inner records ----

    public record OtpEntry(String otp, long expiresAt) {}

    public record OtpResult(
        String email,
        String maskedEmail,
        String maskedPhone,
        String otp,         // returned in response for demo (no real email server)
        String userName
    ) {}
}
