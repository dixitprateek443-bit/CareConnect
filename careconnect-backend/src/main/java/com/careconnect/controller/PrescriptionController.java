package com.careconnect.controller;

import com.careconnect.dto.PrescriptionRequest;
import com.careconnect.entity.Prescription;
import com.careconnect.service.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @GetMapping
    public ResponseEntity<List<Prescription>> getAllPrescriptions() {
        return ResponseEntity.ok(prescriptionService.getAllPrescriptions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPrescriptionById(@PathVariable Long id) {
        return prescriptionService.getPrescriptionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Patient access to their prescriptions
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Prescription>> getPatientPrescriptions(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatientId(patientId));
    }

    // Doctor access to prescriptions they issued
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Prescription>> getDoctorPrescriptions(@PathVariable Long doctorId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByDoctorId(doctorId));
    }

    // Doctor creates and issues a digital prescription
    @PostMapping
    public ResponseEntity<?> issuePrescription(@Valid @RequestBody PrescriptionRequest request) {
        try {
            Prescription saved = prescriptionService.issuePrescription(request);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePrescription(@PathVariable Long id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.ok().build();
    }
}
