package com.careconnect.dto;

public class ForgotPasswordRequest {
    private String identifier; // email or phone

    public ForgotPasswordRequest() {}
    public ForgotPasswordRequest(String identifier) { this.identifier = identifier; }

    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }
}
