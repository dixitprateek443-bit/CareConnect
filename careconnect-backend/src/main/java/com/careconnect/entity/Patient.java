package com.careconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "patient_id")
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Integer age;

    @Column(length = 15)
    private String gender;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(length = 255)
    private String allergies;

    @Column(name = "emergency_contact", length = 30)
    private String emergencyContact;

    public Patient() {}

    public Patient(User user, Integer age, String gender, String bloodGroup, String allergies, String emergencyContact) {
        this.user = user;
        this.age = age;
        this.gender = gender;
        this.bloodGroup = bloodGroup;
        this.allergies = allergies;
        this.emergencyContact = emergencyContact;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
}
