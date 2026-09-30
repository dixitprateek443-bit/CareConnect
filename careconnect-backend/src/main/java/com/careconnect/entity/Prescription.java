package com.careconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prescription_id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false, length = 300)
    private String diagnosis;

    @Lob
    @Column(name = "medicines_json", nullable = false, columnDefinition = "CLOB")
    private String medicinesJson;

    @Column(name = "doctor_notes", length = 1000)
    private String doctorNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Prescription() {}

    public Prescription(Patient patient, Doctor doctor, String diagnosis, String medicinesJson, String doctorNotes) {
        this.patient = patient;
        this.doctor = doctor;
        this.diagnosis = diagnosis;
        this.medicinesJson = medicinesJson;
        this.doctorNotes = doctorNotes;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getMedicinesJson() { return medicinesJson; }
    public void setMedicinesJson(String medicinesJson) { this.medicinesJson = medicinesJson; }

    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
