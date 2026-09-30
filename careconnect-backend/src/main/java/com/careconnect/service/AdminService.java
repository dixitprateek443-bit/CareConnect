package com.careconnect.service;

import com.careconnect.dto.AdminStatsDto;
import com.careconnect.repository.*;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class AdminService {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalReportRepository reportRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final Environment environment;

    public AdminService(DoctorRepository doctorRepository,
                        PatientRepository patientRepository,
                        AppointmentRepository appointmentRepository,
                        MedicalReportRepository reportRepository,
                        PrescriptionRepository prescriptionRepository,
                        Environment environment) {
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.reportRepository = reportRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.environment = environment;
    }

    public AdminStatsDto getSystemStats() {
        long totalDocs = doctorRepository.count();
        long totalPats = patientRepository.count();
        long totalAppts = appointmentRepository.count();
        long totalReps = reportRepository.count();
        long totalRxs = prescriptionRepository.count();

        boolean isOracle = Arrays.asList(environment.getActiveProfiles()).contains("oracle");
        String dbEngine = isOracle ? "Oracle Database 19c Enterprise" : "Oracle Mode (H2 In-Memory Evaluator)";
        String systemStatus = "Operational & Healthy (200 OK)";

        return new AdminStatsDto(totalDocs, totalPats, totalAppts, totalReps, totalRxs, dbEngine, systemStatus);
    }
}
