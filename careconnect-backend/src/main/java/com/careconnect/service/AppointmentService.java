package com.careconnect.service;

import com.careconnect.dto.AppointmentRequest;
import com.careconnect.entity.Appointment;
import com.careconnect.entity.Doctor;
import com.careconnect.entity.Patient;
import com.careconnect.repository.AppointmentRepository;
import com.careconnect.repository.DoctorRepository;
import com.careconnect.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public AppointmentService(AppointmentRepository appointmentRepository, PatientRepository patientRepository, DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Appointment> getAppointmentsByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public Appointment bookAppointment(AppointmentRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with ID: " + request.getDoctorId()));

        Appointment appt = new Appointment(
                patient,
                doctor,
                request.getAppointmentDate(),
                request.getTimeSlot(),
                "CONFIRMED",
                request.getSymptoms(),
                request.getNotes()
        );
        return appointmentRepository.save(appt);
    }

    public Appointment updateStatus(Long id, String status) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + id));
        appt.setStatus(status);
        return appointmentRepository.save(appt);
    }

    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }
}
