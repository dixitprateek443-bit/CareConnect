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
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOpt.get();
        Long doctorId = null;
        Long patientId = null;

        if (user.getRole() == Role.DOCTOR) {
            doctorId = doctorRepository.findByUserId(user.getId())
                    .or(() -> doctorRepository.findByUser(user))
                    .map(Doctor::getId)
                    .orElseGet(() -> {
                        Doctor newDoc = new Doctor(user, "General Medicine", "MBBS, MD", "5+ Years", "$75", "Mon - Fri, 09:00 - 17:00", "Specialist physician dedicated to comprehensive patient care.");
                        return doctorRepository.save(newDoc).getId();
                    });
        } else if (user.getRole() == Role.PATIENT) {
            patientId = patientRepository.findByUserId(user.getId())
                    .or(() -> patientRepository.findByUser(user))
                    .map(Patient::getId)
                    .orElseGet(() -> {
                        Patient newPat = new Patient(user, 30, "Not Specified", "O+", "None Reported", user.getPhone() != null ? user.getPhone() : "Not Provided");
                        return patientRepository.save(newPat).getId();
                    });
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
            String spec = (request.getSpecialization() != null && !request.getSpecialization().trim().isEmpty()) ? request.getSpecialization().trim() : "General Medicine";
            String qual = (request.getQualification() != null && !request.getQualification().trim().isEmpty()) ? request.getQualification().trim() : "MBBS, MD";
            String exp  = (request.getExperience() != null && !request.getExperience().trim().isEmpty()) ? request.getExperience().trim() : "5+ Years";
            String fee  = (request.getFee() != null && !request.getFee().trim().isEmpty()) ? request.getFee().trim() : "$75";
            String days = (request.getAvailableDays() != null && !request.getAvailableDays().trim().isEmpty()) ? request.getAvailableDays().trim() : "Mon - Fri, 09:00 - 17:00";
            String bio  = (request.getBio() != null && !request.getBio().trim().isEmpty()) ? request.getBio().trim() : "Specialist physician dedicated to comprehensive patient care.";

            Doctor doc = new Doctor(user, spec, qual, exp, fee, days, bio);
            doc = doctorRepository.save(doc);
            doctorId = doc.getId();
        } else if (request.getRole() == Role.PATIENT) {
            int age = (request.getAge() != null && request.getAge() > 0) ? request.getAge() : 30;
            String gender = (request.getGender() != null && !request.getGender().trim().isEmpty()) ? request.getGender().trim() : "Not Specified";
            String blood = (request.getBloodGroup() != null && !request.getBloodGroup().trim().isEmpty()) ? request.getBloodGroup().trim() : "O+";
            String allergies = (request.getAllergies() != null && !request.getAllergies().trim().isEmpty()) ? request.getAllergies().trim() : "None Reported";
            String emergency = (request.getEmergencyContact() != null && !request.getEmergencyContact().trim().isEmpty()) ? request.getEmergencyContact().trim() : (request.getPhone() != null ? request.getPhone().trim() : "Not Provided");

            Patient pat = new Patient(user, age, gender, blood, allergies, emergency);
            pat = patientRepository.save(pat);
            patientId = pat.getId();
        }

        String token = "CARE-" + UUID.randomUUID().toString().substring(0, 18).toUpperCase();
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), doctorId, patientId, "Registration successful");
    }
}
