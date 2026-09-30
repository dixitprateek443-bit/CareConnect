export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface PatientProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  age: number;
  bloodGroup: string;
  allergies: string;
  emergencyContact: string;
}

export interface DoctorProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  experience: string;
  consultationFee: number;
  availableDays: string;
  rating: string;
  bio: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  patientBlood: string;
  doctorId: number;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
}

export interface Prescription {
  id: number;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  diagnosis: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
  }[];
  doctorNotes: string;
}
