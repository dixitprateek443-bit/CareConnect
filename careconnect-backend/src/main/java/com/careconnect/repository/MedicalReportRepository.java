package com.careconnect.repository;

import com.careconnect.entity.MedicalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    List<MedicalReport> findByPatientId(Long patientId);
    List<MedicalReport> findByDoctorId(Long doctorId);
    List<MedicalReport> findAllByOrderByCreatedAtDesc();
}
