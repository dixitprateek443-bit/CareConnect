package com.careconnect.dto;

import com.careconnect.entity.Role;

public class AuthResponse {

    private String token;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private Long doctorId;
    private Long patientId;
    private String message;

    public AuthResponse() {}

    public AuthResponse(String token, Long userId, String name, String email, Role role, Long doctorId, Long patientId, String message) {
        this.token = token;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.message = message;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
