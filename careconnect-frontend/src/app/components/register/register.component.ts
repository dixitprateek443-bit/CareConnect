import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon"><i class="fa-solid fa-user-plus"></i></div>
          <h2>Patient Registration</h2>
          <p>Create your personal EHR dossier and start consulting specialists</p>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Full Legal Name</label>
            <input type="text" [(ngModel)]="name" name="name" class="input-control" placeholder="John Doe" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="email" name="email" class="input-control" placeholder="john@example.com" required>
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="tel" [(ngModel)]="phone" name="phone" class="input-control" placeholder="+1 555-012-3456" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Blood Group</label>
              <select [(ngModel)]="bloodGroup" name="bloodGroup" class="input-control" required>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Date of Birth</label>
              <input type="date" [(ngModel)]="dob" name="dob" class="input-control" required>
            </div>
          </div>

          <div class="form-group">
            <label>Known Allergies / Medical Notes</label>
            <input type="text" [(ngModel)]="allergies" name="allergies" class="input-control" placeholder="e.g. Penicillin, Pollen, or None">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" class="input-control" placeholder="••••••••" required>
          </div>

          <button type="submit" class="btn btn-success" style="width:100%;">
            Sign Up & Land on Patient Dashboard
          </button>
        </form>

        <div style="text-align:center; margin-top:20px; font-size:13px;">
          Already have an account? <a (click)="router.navigate(['/login'])" style="color:var(--primary); cursor:pointer; font-weight:700;">Sign in</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  name = '';
  email = '';
  phone = '';
  bloodGroup = 'O+';
  dob = '1995-01-01';
  allergies = 'None';
  password = '';

  constructor(public authService: AuthService, public router: Router) {}

  onSubmit(): void {
    // Automatically lands user on Patient Dashboard upon sign up
    this.router.navigate(['/patient-dashboard']);
  }
}
