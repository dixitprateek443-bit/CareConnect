package com.careconnect.service;

import com.careconnect.entity.Doctor;
import com.careconnect.entity.Patient;
import com.careconnect.entity.Appointment;
import com.careconnect.repository.AppointmentRepository;
import com.careconnect.repository.DoctorRepository;
import com.careconnect.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;

    public DoctorService(DoctorRepository doctorRepository, AppointmentRepository appointmentRepository, PatientRepository patientRepository) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
    }

    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public Optional<Doctor> getDoctorById(Long id) {
        return doctorRepository.findById(id);
    }

    public Optional<Doctor> getDoctorByUserId(Long userId) {
        return doctorRepository.findByUserId(userId);
    }

    public List<Appointment> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    // Patient details visible to the doctor based on appointments
    public List<Patient> getDoctorPatients(Long doctorId) {
        List<Appointment> appts = appointmentRepository.findByDoctorId(doctorId);
        return appts.stream()
                .map(Appointment::getPatient)
                .distinct()
                .collect(Collectors.toList());
    }

    public Doctor saveDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    public void deleteDoctor(Long id) {
        doctorRepository.deleteById(id);
    }
}
