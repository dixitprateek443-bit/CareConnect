package com.careconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "doctor_id")
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 100)
    private String specialization;

    @Column(nullable = false, length = 100)
    private String qualification;

    @Column(nullable = false, length = 50)
    private String experience;

    @Column(nullable = false, length = 30)
    private String fee;

    @Column(name = "available_days", nullable = false, length = 100)
    private String availableDays;

    @Column(length = 1000)
    private String bio;

    public Doctor() {}

    public Doctor(User user, String specialization, String qualification, String experience, String fee, String availableDays, String bio) {
        this.user = user;
        this.specialization = specialization;
        this.qualification = qualification;
        this.experience = experience;
        this.fee = fee;
        this.availableDays = availableDays;
        this.bio = bio;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public String getFee() { return fee; }
    public void setFee(String fee) { this.fee = fee; }

    public String getAvailableDays() { return availableDays; }
    public void setAvailableDays(String availableDays) { this.availableDays = availableDays; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
