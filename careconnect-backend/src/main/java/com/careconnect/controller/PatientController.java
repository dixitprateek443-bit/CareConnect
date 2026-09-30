package com.careconnect.controller;

import com.careconnect.entity.Appointment;
import com.careconnect.entity.MedicalReport;
import com.careconnect.entity.Patient;
import com.careconnect.entity.Prescription;
import com.careconnect.service.AppointmentService;
import com.careconnect.service.PatientService;
import com.careconnect.service.PrescriptionService;
import com.careconnect.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;
    private final ReportService reportService;
    private final PrescriptionService prescriptionService;
    private final AppointmentService appointmentService;

    public PatientController(PatientService patientService,
                             ReportService reportService,
                             PrescriptionService prescriptionService,
                             AppointmentService appointmentService) {
        this.patientService = patientService;
        this.reportService = reportService;
        this.prescriptionService = prescriptionService;
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getPatientByUserId(@PathVariable Long userId) {
        return patientService.getPatientByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Patient accesses their medical reports
    @GetMapping("/{id}/reports")
    public ResponseEntity<List<MedicalReport>> getPatientReports(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReportsByPatientId(id));
    }

    // Patient accesses their prescriptions
    @GetMapping("/{id}/prescriptions")
    public ResponseEntity<List<Prescription>> getPatientPrescriptions(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatientId(id));
    }

    // Patient views their appointments
    @GetMapping("/{id}/appointments")
    public ResponseEntity<List<Appointment>> getPatientAppointments(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByPatientId(id));
    }
}
