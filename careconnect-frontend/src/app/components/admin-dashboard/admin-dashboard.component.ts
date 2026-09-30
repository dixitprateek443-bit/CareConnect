import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-banner admin-banner">
      <div class="banner-left">
        <h2>Hospital Administration Dashboard</h2>
        <p>Central Clinical Governance & Hospital Infrastructure</p>
      </div>
    </div>

    <!-- ADMINISTRATION DETAILS SECTION AT ADMIN -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-value">{{ doctorsCount }}</div>
          <div class="stat-label">Total Doctors Managed</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-value">{{ patientsCount }}</div>
          <div class="stat-label">Registered Patients</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-value">Active</div>
          <div class="stat-label">System Security: Encrypted</div>
        </div>
      </div>
    </div>

    <div class="admin-panel">
      <div class="panel-header">
        <h3>Administration & Clinical Staff Governance</h3>
      </div>
      <p style="font-size:13.5px; color:var(--text-muted); margin-bottom:15px;">
        Oversee hospital department allocations, doctor onboarding, and patient registration audit logs.
      </p>
    </div>
  `
})
export class AdminDashboardComponent {
  doctorsCount = 4;
  patientsCount = 3;
}
