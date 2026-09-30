package com.careconnect.controller;

import com.careconnect.entity.Appointment;
import com.careconnect.entity.Doctor;
import com.careconnect.entity.MedicalReport;
import com.careconnect.entity.Patient;
import com.careconnect.service.DoctorService;
import com.careconnect.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;
    private final ReportService reportService;

    public DoctorController(DoctorService doctorService, ReportService reportService) {
        this.doctorService = doctorService;
        this.reportService = reportService;
    }

    // Patient and public can view all available doctor details
    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDoctorById(@PathVariable Long id) {
        return doctorService.getDoctorById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getDoctorByUserId(@PathVariable Long userId) {
        return doctorService.getDoctorByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Patient details visible at doctor
    @GetMapping("/{id}/patients")
    public ResponseEntity<List<Patient>> getDoctorPatients(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorPatients(id));
    }

    // Consultations assigned to this doctor
    @GetMapping("/{id}/appointments")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorAppointments(id));
    }

    // Reports authored by this doctor
    @GetMapping("/{id}/reports")
    public ResponseEntity<List<MedicalReport>> getDoctorReports(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReportsByDoctorId(id));
    }

    @PostMapping
    public ResponseEntity<Doctor> createDoctor(@RequestBody Doctor doctor) {
        return ResponseEntity.ok(doctorService.saveDoctor(doctor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.ok().build();
    }
}
