package com.careconnect.service;

import com.careconnect.dto.AuthRequest;
import com.careconnect.dto.AuthResponse;
import com.careconnect.dto.RegisterRequest;
import com.careconnect.entity.Doctor;
import com.careconnect.entity.Patient;
import com.careconnect.entity.Role;
import com.careconnect.entity.User;
import com.careconnect.repository.DoctorRepository;
import com.careconnect.repository.PatientRepository;
import com.careconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    public AuthService(UserRepository userRepository, DoctorRepository doctorRepository, PatientRepository patientRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
    }

    public AuthResponse login(AuthRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOpt.get();
        Long doctorId = null;
        Long patientId = null;

        if (user.getRole() == Role.DOCTOR) {
            doctorId = doctorRepository.findByUser(user).map(Doctor::getId).orElse(null);
        } else if (user.getRole() == Role.PATIENT) {
            patientId = patientRepository.findByUser(user).map(Patient::getId).orElse(null);
        }

        String token = "CARE-" + UUID.randomUUID().toString().substring(0, 18).toUpperCase();
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), doctorId, patientId, "Authentication successful");
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with email " + email + " already exists");
        }

        User user = new User(request.getName().trim(), email, request.getPassword(), request.getRole(), request.getPhone());
        user = userRepository.save(user);

        Long doctorId = null;
        Long patientId = null;

        if (request.getRole() == Role.DOCTOR) {
            Doctor doc = new Doctor(
                    user,
                    request.getSpecialization() != null ? request.getSpecialization() : "General Medicine",
                    request.getQualification() != null ? request.getQualification() : "MBBS, MD",
                    request.getExperience() != null ? request.getExperience() : "5+ Years",
                    request.getFee() != null ? request.getFee() : "$75",
                    request.getAvailableDays() != null ? request.getAvailableDays() : "Mon - Fri, 09:00 - 17:00",
                    request.getBio() != null ? request.getBio() : "Specialist physician dedicated to comprehensive patient care."
            );
            doc = doctorRepository.save(doc);
            doctorId = doc.getId();
        } else if (request.getRole() == Role.PATIENT) {
            Patient pat = new Patient(
                    user,
                    request.getAge() != null ? request.getAge() : 30,
                    request.getGender() != null ? request.getGender() : "Not Specified",
                    request.getBloodGroup() != null ? request.getBloodGroup() : "O+",
                    request.getAllergies() != null ? request.getAllergies() : "None Reported",
                    request.getEmergencyContact() != null ? request.getEmergencyContact() : request.getPhone()
            );
            pat = patientRepository.save(pat);
            patientId = pat.getId();
        }

        String token = "CARE-" + UUID.randomUUID().toString().substring(0, 18).toUpperCase();
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), doctorId, patientId, "Registration successful");
    }
}
