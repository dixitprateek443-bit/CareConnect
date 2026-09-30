# CareConnect — Software Module Documentation
**A Patient Record & Healthcare Management System**
*Academic Project Specification for College Submission & Viva Defense*

---

## 1. Executive Summary & Project Objectives
**CareConnect** is an integrated web-based Electronic Health Record (EHR) and Patient Management solution designed to digitize outpatient clinical workflows. The software bridges the communication gap between patients, healthcare professionals, and clinic administration by providing secure medical record tracking, digital appointments, and tamper-proof electronic prescriptions.

### Core Objectives
1. **Role-Based Access Control (RBAC)**: Enforce strict boundaries between Admin, Doctor, and Patient access.
2. **Unified Patient Dossier**: Instant retrieval of medical history, vitals, allergies, and prior clinical visits.
3. **Lifecycle-Driven Appointments**: State machine managing `PENDING` ➔ `CONFIRMED` ➔ `COMPLETED` / `CANCELLED`.
4. **Standardized E-Prescriptions**: Generation of digital prescriptions with drug dosages, frequencies, and advice.
5. **Interactive OpenAPI / Swagger Documentation**: Evaluator-ready REST API exploration.

---

## 2. System Architecture & Technology Stack

### Architecture
- **Pattern**: Client-Server (N-Tier) RESTful Architecture
- **Frontend Tier**: Angular SPA (TypeScript & RxJS) with modern, responsive components
- **Backend Tier**: Java 17/21/26 with Spring Boot 3 (Spring Web, Spring Security, Spring Data JPA)
- **Data Tier**: Oracle Database (Oracle 19c/21c/23c XE) via `ojdbc11`

### Technology Stack Table
| Component | Technology | Role & Justification |
| :--- | :--- | :--- |
| **Frontend** | Angular (TypeScript, RxJS, HTML/CSS) | Modular Single-Page Application with components, two-way binding, and guards. |
| **Backend API** | Java 17/21/26 + Spring Boot 3 | Enterprise-grade backend with modular controllers, services, and dependency injection. |
| **Security** | Spring Security + JWT | Stateless bearer token authentication with role-based method security. |
| **ORM / Data Access**| Spring Data JPA (Hibernate) | Relational mapping, automated queries, and schema generation with Oracle Dialect. |
| **Database** | Oracle DB (ojdbc11) | Robust enterprise ACID-compliant relational storage for clinical records. |
| **Documentation** | Springdoc OpenAPI (Swagger UI) | Live interactive documentation accessible at `/swagger-ui.html`. |

---

## 3. Detailed Functional Modules Breakdown

### Module 1: User Authentication & Role-Based Access Control (RBAC)
- **Purpose**: Authenticates users and enforces strict permission boundaries.
- **Roles**:
  - `ROLE_PATIENT`: Self-registration, view own health history, book appointments, view own prescriptions.
  - `ROLE_DOCTOR`: Manage schedule, consult assigned patients, issue prescriptions, view patient records.
  - `ROLE_ADMIN`: System monitoring, doctor onboarding, department management.
- **Key Security Features**:
  - Password hashing via BCrypt.
  - Signed JSON Web Tokens (JWT) passed in HTTP `Authorization: Bearer <token>` headers.
  - Method-level route security using `@PreAuthorize("hasRole('DOCTOR')")`.
- **Primary Endpoints**:
  - `POST /api/auth/register` (Register patient)
  - `POST /api/auth/login` (Verify credentials & return JWT)
  - `GET /api/auth/me` (Current authenticated user profile)

---

### Module 2: Patient Health Records & Demographics (EHR)
- **Purpose**: Stores clinical baseline data, vital statistics, emergency contact details, and chronic health history.
- **Key Features**:
  - **Demographics**: Date of Birth, Gender, Blood Group, Contact, Emergency Contact.
  - **Clinical Vitals**: Height, Weight, Blood Pressure, Pulse, Known Allergies (e.g., Penicillin).
  - **Chronological Timeline**: History of all past visits, consultation notes, and diagnoses.
  - **Data Privacy**: Strict access isolation ensuring patients cannot access other patients' files.
- **Primary Endpoints**:
  - `GET /api/patients/profile` (Logged-in patient's complete file)
  - `PUT /api/patients/profile` (Update personal contact and vitals)
  - `GET /api/patients/{id}/records` (Doctor retrieves patient's history during consultation)

---

### Module 3: Appointment Scheduling & Consultation Lifecycle
- **Purpose**: Coordinates booking requests, doctor schedules, and consultation state transitions.
- **Appointment Lifecycle**:
  $$\text{PENDING} \xrightarrow{\text{Doctor Accepts}} \text{CONFIRMED} \xrightarrow{\text{Consultation Done}} \text{COMPLETED}$$
  *(Supports `CANCELLED` state with audit reason)*
- **Key Features**:
  - **Doctor Directory**: Search and filter by specialty (Cardiology, Dermatology, General Medicine).
  - **Slot Reservation**: Date, time slot selection, and consultation reason submission.
  - **Doctor Workstation**: Real-time queue view of waiting patients with status badges.
- **Primary Endpoints**:
  - `GET /api/doctors` (List doctors with qualifications, fees & specialty)
  - `POST /api/appointments/book` (Create booking request)
  - `GET /api/appointments/my` (Get appointments filtered by user role)
  - `PATCH /api/appointments/{id}/status` (Doctor updates appointment status)

---

### Module 4: Clinical Diagnosis & E-Prescription Generator
- **Purpose**: Enables doctors to record consultation diagnoses and issue clean, structured digital prescriptions.
- **Key Features**:
  - **Structured Medication Entry**: Drug name, dosage (e.g., 500mg), frequency (1-0-1), duration, and instructions (After food).
  - **Clinical Observations**: Doctor notes, dietary instructions, and lab test recommendations.
  - **Printable Prescription Layout**: Formatted medical header with doctor credentials, patient details, and Rx list.
  - **Immutable Archival**: Prescriptions are permanently saved and linked to patient history.
- **Primary Endpoints**:
  - `POST /api/prescriptions` (Doctor issues prescription for an appointment)
  - `GET /api/prescriptions/{appointmentId}` (Fetch prescription by appointment)
  - `GET /api/prescriptions/patient/history` (Patient views all past prescriptions)

---

## 4. Database Schema (5 Core Relational Entities)

1. **`users`**
   - `id`: BIGINT (PK)
   - `name`: VARCHAR
   - `email`: VARCHAR (Unique)
   - `password`: VARCHAR (BCrypt hash)
   - `role`: ENUM (`ADMIN`, `DOCTOR`, `PATIENT`)

2. **`patients`**
   - `id`: BIGINT (PK)
   - `user_id`: BIGINT (FK ➔ `users.id`)
   - `dob`: DATE
   - `gender`: VARCHAR
   - `blood_group`: VARCHAR
   - `phone`: VARCHAR
   - `allergies`: TEXT

3. **`doctors`**
   - `id`: BIGINT (PK)
   - `user_id`: BIGINT (FK ➔ `users.id`)
   - `specialization`: VARCHAR
   - `qualification`: VARCHAR
   - `consultation_fee`: DECIMAL
   - `available_days`: VARCHAR

4. **`appointments`**
   - `id`: BIGINT (PK)
   - `patient_id`: BIGINT (FK ➔ `patients.id`)
   - `doctor_id`: BIGINT (FK ➔ `doctors.id`)
   - `appointment_date`: DATETIME
   - `reason`: TEXT
   - `status`: ENUM (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`)

5. **`prescriptions`**
   - `id`: BIGINT (PK)
   - `appointment_id`: BIGINT (FK ➔ `appointments.id`)
   - `diagnosis`: VARCHAR
   - `medicines`: JSON / TEXT
   - `doctor_notes`: TEXT
   - `created_at`: TIMESTAMP

---

## 5. College Viva Demonstration Script (5-Minute Walkthrough)

| Minute | Step | Action & Key Talking Point |
| :--- | :--- | :--- |
| **00:00 - 01:00** | **Admin Dashboard** | Log into Admin view. Highlight system metrics (Total doctors, patients, appointments) and H2/MySQL database connection. |
| **01:00 - 02:30** | **Patient Booking** | Register test patient (e.g., *John Doe*). Enter vitals (O+, Allergy: Penicillin). Filter doctors by specialty, book appointment slot. Status shows `PENDING`. |
| **02:30 - 03:30** | **Doctor Consultation** | Log in as Doctor. Open consultation queue, inspect patient's prior medical records, click **Accept & Start**. Status updates to `CONFIRMED`. |
| **03:30 - 04:30** | **Prescription Generation** | Doctor inputs diagnosis (*Mild Hypertension*) and medication (*Amlodipine 5mg - 1-0-0*). Clicks **Issue & Complete**. Status turns `COMPLETED`. |
| **04:30 - 05:00** | **Patient Output & Swagger** | Switch to Patient view to show digital prescription with print-ready layout. Show live REST endpoints in Swagger UI (`/swagger-ui.html`). |
