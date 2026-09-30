package com.careconnect.service;

import com.careconnect.dto.ReportUploadRequest;
import com.careconnect.entity.Doctor;
import com.careconnect.entity.MedicalReport;
import com.careconnect.entity.Patient;
import com.careconnect.repository.DoctorRepository;
import com.careconnect.repository.MedicalReportRepository;
import com.careconnect.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReportService {

    private final MedicalReportRepository reportRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public ReportService(MedicalReportRepository reportRepository, PatientRepository patientRepository, DoctorRepository doctorRepository) {
        this.reportRepository = reportRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public List<MedicalReport> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<MedicalReport> getReportsByPatientId(Long patientId) {
        return reportRepository.findByPatientId(patientId);
    }

    public List<MedicalReport> getReportsByDoctorId(Long doctorId) {
        return reportRepository.findByDoctorId(doctorId);
    }

    public Optional<MedicalReport> getReportById(Long id) {
        return reportRepository.findById(id);
    }

    // Doctor uploads/creates a patient medical report
    public MedicalReport uploadReport(ReportUploadRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with ID: " + request.getDoctorId()));

        MedicalReport report = new MedicalReport(
                patient,
                doctor,
                request.getTitle(),
                request.getTestType(),
                request.getReportDate(),
                request.getDescription(),
                request.getFileLabel() != null ? request.getFileLabel() : "Report_Document.pdf",
                request.getStatus() != null ? request.getStatus() : "REVIEWED"
        );
        return reportRepository.save(report);
    }

    public void deleteReport(Long id) {
        reportRepository.deleteById(id);
    }
}
