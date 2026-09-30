package com.careconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_reports")
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "test_type", nullable = false, length = 100)
    private String testType;

    @Column(name = "report_date", nullable = false, length = 20)
    private String reportDate;

    @Column(length = 2000)
    private String description;

    @Column(name = "file_label", length = 150)
    private String fileLabel;

    @Column(length = 20)
    private String status = "REVIEWED"; // REVIEWED, PENDING

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public MedicalReport() {}

    public MedicalReport(Patient patient, Doctor doctor, String title, String testType, String reportDate, String description, String fileLabel, String status) {
        this.patient = patient;
        this.doctor = doctor;
        this.title = title;
        this.testType = testType;
        this.reportDate = reportDate;
        this.description = description;
        this.fileLabel = fileLabel;
        this.status = status != null ? status : "REVIEWED";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
