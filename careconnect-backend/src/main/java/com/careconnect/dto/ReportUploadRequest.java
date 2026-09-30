package com.careconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ReportUploadRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotBlank(message = "Report title is required")
    private String title;

    @NotBlank(message = "Test type is required")
    private String testType;

    @NotBlank(message = "Report date is required")
    private String reportDate;

    private String description;
    private String fileLabel;
    private String status;

    public ReportUploadRequest() {}

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }

    public String getReportDate() { return reportDate; }
    public void setReportDate(String reportDate) { this.reportDate = reportDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFileLabel() { return fileLabel; }
    public void setFileLabel(String fileLabel) { this.fileLabel = fileLabel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
