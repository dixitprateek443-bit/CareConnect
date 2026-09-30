package com.careconnect.service;

import com.careconnect.dto.PrescriptionRequest;
import com.careconnect.entity.Doctor;
import com.careconnect.entity.Patient;
import com.careconnect.entity.Prescription;
import com.careconnect.repository.DoctorRepository;
import com.careconnect.repository.PatientRepository;
import com.careconnect.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public PrescriptionService(PrescriptionRepository prescriptionRepository, PatientRepository patientRepository, DoctorRepository doctorRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Prescription> getPrescriptionsByPatientId(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    public List<Prescription> getPrescriptionsByDoctorId(Long doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId);
    }

    public Optional<Prescription> getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id);
    }

    public Prescription issuePrescription(PrescriptionRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with ID: " + request.getDoctorId()));

        Prescription rx = new Prescription(
                patient,
                doctor,
                request.getDiagnosis(),
                request.getMedicinesJson(),
                request.getDoctorNotes()
        );
        return prescriptionRepository.save(rx);
    }

    public void deletePrescription(Long id) {
        prescriptionRepository.deleteById(id);
    }
}
