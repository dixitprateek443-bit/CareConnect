import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/careconnect.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon"><i class="fa-solid fa-user-lock"></i></div>
          <h2>CareConnect Sign In</h2>
          <p>Select your user role to access your dedicated dashboard</p>
        </div>

        <div class="role-picker">
          <label>Select User Role</label>
          <div class="role-chips">
            <button type="button" [class.selected]="selectedRole === 'PATIENT'" (click)="setRole('PATIENT')" class="role-chip patient">
              <i class="fa-solid fa-user-injured"></i><span>Patient</span>
            </button>
            <button type="button" [class.selected]="selectedRole === 'DOCTOR'" (click)="setRole('DOCTOR')" class="role-chip doctor">
              <i class="fa-solid fa-user-doctor"></i><span>Doctor</span>
            </button>
            <button type="button" [class.selected]="selectedRole === 'ADMIN'" (click)="setRole('ADMIN')" class="role-chip admin">
              <i class="fa-solid fa-shield-halved"></i><span>Admin</span>
            </button>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" class="input-control" placeholder="user@careconnect.com" required>
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" class="input-control" placeholder="••••••••" required>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;">
            Sign In as {{ selectedRole }}
          </button>
        </form>

        <div style="text-align:center; margin-top:20px; font-size:13px;">
          Don't have an account? <a (click)="router.navigate(['/register'])" style="color:var(--primary); cursor:pointer; font-weight:700;">Sign up as Patient</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email: string = 'john@gmail.com';
  password: string = 'password123';
  selectedRole: UserRole = 'PATIENT';

  constructor(public authService: AuthService, public router: Router) {}

  setRole(role: UserRole): void {
    this.selectedRole = role;
    if (role === 'PATIENT') this.email = 'john@gmail.com';
    else if (role === 'DOCTOR') this.email = 'dr.smith@careconnect.com';
    else if (role === 'ADMIN') this.email = 'admin@careconnect.com';
  }

  onSubmit(): void {
    // Navigates directly to the specific dashboard on sign in
    if (this.selectedRole === 'PATIENT') {
      this.router.navigate(['/patient-dashboard']);
    } else if (this.selectedRole === 'DOCTOR') {
      this.router.navigate(['/doctor-dashboard']);
    } else if (this.selectedRole === 'ADMIN') {
      this.router.navigate(['/admin-dashboard']);
    }
  }
}
