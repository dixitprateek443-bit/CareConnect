import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-banner doctor-banner">
      <div class="banner-left">
        <h2>Doctor Clinical Workstation</h2>
        <p>OPD Queue &bull; Patient History Review &bull; E-Prescription Management</p>
      </div>
    </div>

    <!-- PATIENT DETAILS SECTION AT DOCTOR -->
    <div class="section-header">
      <div class="section-title-wrap">
        <h2><i class="fa-solid fa-users-medical"></i> Patient Medical Records & Waiting Queue</h2>
        <p>Review health history, vitals, and issue clinical prescriptions</p>
      </div>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="app-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Blood Group</th>
              <th>Known Allergies</th>
              <th>Consultation Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of patientQueue">
              <td><strong>{{ p.name }}</strong> (Age: {{ p.age }})</td>
              <td><span class="badge-tag">{{ p.bloodGroup }}</span></td>
              <td><span style="color:var(--danger); font-weight:700;">{{ p.allergies }}</span></td>
              <td>{{ p.reason }}</td>
              <td><span class="status-badge status-pending">{{ p.status }}</span></td>
              <td>
                <button class="btn btn-success btn-sm">Consult & Prescribe</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DoctorDashboardComponent {
  patientQueue = [
    { name: 'John Doe', age: 32, bloodGroup: 'O+', allergies: 'Penicillin', reason: 'Chest tightness after exertion', status: 'PENDING' },
    { name: 'Emily Clark', age: 28, bloodGroup: 'A+', allergies: 'Sulfa Drugs', reason: 'Seasonal allergic cough', status: 'CONFIRMED' }
  ];
}
