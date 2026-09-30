package com.careconnect.controller;

import com.careconnect.dto.AdminStatsDto;
import com.careconnect.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final DoctorService doctorService;
    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final ReportService reportService;
    private final PrescriptionService prescriptionService;

    public AdminController(AdminService adminService,
                           DoctorService doctorService,
                           PatientService patientService,
                           AppointmentService appointmentService,
                           ReportService reportService,
                           PrescriptionService prescriptionService) {
        this.adminService = adminService;
        this.doctorService = doctorService;
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.reportService = reportService;
        this.prescriptionService = prescriptionService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    // Full system governance and data oversight for Admin
    @GetMapping("/all-data")
    public ResponseEntity<Map<String, Object>> getAllHospitalData() {
        Map<String, Object> data = new HashMap<>();
        data.put("stats", adminService.getSystemStats());
        data.put("doctors", doctorService.getAllDoctors());
        data.put("patients", patientService.getAllPatients());
        data.put("appointments", appointmentService.getAllAppointments());
        data.put("reports", reportService.getAllReports());
        data.put("prescriptions", prescriptionService.getAllPrescriptions());
        return ResponseEntity.ok(data);
    }
}
