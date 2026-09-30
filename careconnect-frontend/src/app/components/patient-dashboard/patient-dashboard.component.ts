import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorProfile } from '../../models/careconnect.models';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-banner">
      <div class="banner-left">
        <h2>Welcome, Patient Dashboard</h2>
        <p>Personal Health Dossier & Doctor Directory</p>
        <div class="banner-pills">
          <span class="badge-tag">Blood Group: <strong>O+</strong></span>
          <span class="badge-tag">Allergies: <strong>Penicillin</strong></span>
        </div>
      </div>
    </div>

    <!-- DOCTOR'S DETAILS SECTION AT PATIENT -->
    <div class="section-header">
      <div class="section-title-wrap">
        <h2><i class="fa-solid fa-user-doctor"></i> Available Hospital Doctors & Specialists</h2>
        <p>Browse medical profiles, qualifications, and consultation fees</p>
      </div>
    </div>

    <div class="doctors-grid">
      <div class="doctor-card" *ngFor="let doc of doctors">
        <div class="doc-top">
          <div class="doc-avatar">{{ doc.name.charAt(4) }}</div>
          <div class="doc-details">
            <h3>{{ doc.name }}</h3>
            <span class="doc-spec">{{ doc.specialization }}</span>
            <div class="doc-qual">{{ doc.qualification }}</div>
          </div>
        </div>
        <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">{{ doc.bio }}</p>
        <div class="doc-meta">
          <div class="doc-meta-item">
            <strong>Experience</strong><span>{{ doc.experience }}</span>
          </div>
          <div class="doc-meta-item">
            <strong>Fee</strong><span>\${{ doc.consultationFee }}</span>
          </div>
          <div class="doc-meta-item" style="grid-column: span 2;">
            <strong>Available Days</strong><span>{{ doc.availableDays }}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" style="width:100%;">
          Book Appointment
        </button>
      </div>
    </div>
  `
})
export class PatientDashboardComponent {
  doctors: DoctorProfile[] = [
    {
      id: 1,
      userId: 2,
      name: 'Dr. Robert Smith',
      email: 'dr.smith@careconnect.com',
      phone: '+1 555-019-2831',
      specialization: 'Cardiology',
      qualification: 'MD, DM (Cardiology)',
      experience: '14 Years',
      consultationFee: 60,
      availableDays: 'Mon, Wed, Fri',
      rating: '4.9 ★',
      bio: 'Non-invasive cardiology and hypertension expert.'
    },
    {
      id: 2,
      userId: 3,
      name: 'Dr. Sarah Jenkins',
      email: 'dr.sarah@careconnect.com',
      phone: '+1 555-019-8872',
      specialization: 'Pediatrics',
      qualification: 'MBBS, MD (Pediatrics)',
      experience: '10 Years',
      consultationFee: 50,
      availableDays: 'Tue, Thu, Sat',
      rating: '4.8 ★',
      bio: 'Dedicated child healthcare and immunization specialist.'
    }
  ];
}
