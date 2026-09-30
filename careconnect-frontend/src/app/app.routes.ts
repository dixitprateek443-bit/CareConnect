import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard.component';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'patient-dashboard', component: PatientDashboardComponent },
  { path: 'doctor-dashboard', component: DoctorDashboardComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: '**', redirectTo: 'login' }
];
