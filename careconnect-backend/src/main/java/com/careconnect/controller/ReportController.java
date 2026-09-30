package com.careconnect.controller;

import com.careconnect.dto.ReportUploadRequest;
import com.careconnect.entity.MedicalReport;
import com.careconnect.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // Admin & global report access
    @GetMapping
    public ResponseEntity<List<MedicalReport>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReportById(@PathVariable Long id) {
        return reportService.getReportById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Patient access to their reports
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalReport>> getPatientReports(@PathVariable Long patientId) {
        return ResponseEntity.ok(reportService.getReportsByPatientId(patientId));
    }

    // Doctor access to reports they generated
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<MedicalReport>> getDoctorReports(@PathVariable Long doctorId) {
        return ResponseEntity.ok(reportService.getReportsByDoctorId(doctorId));
    }

    // Doctor uploads patient report
    @PostMapping
    public ResponseEntity<?> uploadReport(@Valid @RequestBody ReportUploadRequest request) {
        try {
            MedicalReport saved = reportService.uploadReport(request);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Delete report (doctor or admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.ok().build();
    }
}
