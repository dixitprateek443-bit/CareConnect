# CareConnect Backend — Spring Boot 3 & Oracle DB

Enterprise Hospital & Patient Record Management System (EHR) backend built with **Java 17+ / Spring Boot 3.3.4**, **Spring Data JPA (Hibernate)**, and **Oracle Database (19c/21c/23c)**.

---

## 🚀 Key Features & Modules

### 1. User Authentication & Registration Module
- Multi-role role-based access control (`PATIENT`, `DOCTOR`, `ADMIN`).
- Unified registration endpoint automatically provisioning either doctor clinical credentials or patient health dossiers.
- Session / Bearer token authentication with instant profile retrieval.

### 2. Doctor Module
- Medical specialist directory with experience, consultation fee, schedule, and bio.
- Doctor-patient linkage: Doctors can view patients assigned to them.
- **Report Uploading**: Doctors can author and upload lab reports for patients.
- **Digital E-Prescriptions**: Doctors can write prescriptions with structured medicine schedules and clinical advice.

### 3. Patient Module
- Access to certified doctor directory for consultation booking.
- **Medical Reports Access**: Patients can view and download all their lab reports and pathology records.
- **Digital Prescriptions Access**: Patients can review active prescriptions and print them.
- Profile management (blood group, allergies, emergency contacts).

### 4. Hospital Administration & Governance Module
- Real-time clinical analytics: total doctors, registered patients, consultations, diagnostic reports, and issued prescriptions.
- Full system oversight (`GET /api/admin/all-data`) across all entities.

---

## 🛠️ Technology Stack
- **Language**: Java 17+ (Compiled and tested on JDK 26)
- **Framework**: Spring Boot 3.3.4 (Spring Web, Spring Data JPA, Hibernate ORM)
- **Database Engine**: 
  - **Oracle Database**: Native `ojdbc11` driver with dedicated `oracle-schema.sql` DDL and `application-oracle.properties`.
  - **Embedded Evaluator**: In-memory Oracle-compatible mode for instant college demonstration without external database setup.
- **Build Tool**: Apache Maven 3.9+

---

## 🏃 Running the Backend

### Option A: Standard Run (Zero-Setup Evaluator Mode)
Runs immediately with pre-seeded demo clinical data:
```bash
cd careconnect-backend
mvn spring-boot:run
```
- Server: `http://localhost:8080`
- API Root: `http://localhost:8080/api`
- Database Console: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:mem:careconnectdb;MODE=Oracle`
  - User: `careconnect`
  - Password: `careconnect123`

### Option B: Oracle 19c / 21c Database Mode
1. Run the DDL script in Oracle SQL Developer:
   - File: [`src/main/resources/oracle-schema.sql`](src/main/resources/oracle-schema.sql)
2. Update connection credentials in [`src/main/resources/application-oracle.properties`](src/main/resources/application-oracle.properties).
3. Start Spring Boot with the `oracle` profile:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=oracle
```

---

## 🔑 Default Credentials for Viva & Testing

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@careconnect.com` | `admin123` |
| **Cardiologist** | `dr.sharma@careconnect.com` | `doctor123` |
| **Neurologist** | `dr.patel@careconnect.com` | `doctor123` |
| **Patient** | `rahul.verma@careconnect.com` | `patient123` |
| **Patient** | `sneha.k@careconnect.com` | `patient123` |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user as Patient, Doctor, or Admin |
| `POST` | `/api/auth/login` | Authenticate and retrieve role-based token |
| `GET` | `/api/auth/health` | Health check endpoint |
| `GET` | `/api/doctors` | Browse all specialist doctors (Patient view) |
| `GET` | `/api/doctors/{id}/patients` | Patient details assigned to doctor (Doctor view) |
| `GET` | `/api/doctors/{id}/appointments` | Consultations booked for doctor |
| `GET` | `/api/patients` | All registered patients (Admin view) |
| `GET` | `/api/patients/{id}/reports` | Patient accesses their medical reports |
| `GET` | `/api/patients/{id}/prescriptions` | Patient accesses their digital prescriptions |
| `POST` | `/api/appointments` | Book consultation with specialist |
| `PATCH`| `/api/appointments/{id}/status` | Update consultation status |
| `POST` | `/api/reports` | **Doctor uploads patient medical report** |
| `GET` | `/api/reports/patient/{id}` | **Patient accesses their lab reports** |
| `POST` | `/api/prescriptions` | Doctor issues digital e-prescription |
| `GET` | `/api/admin/stats` | **Admin system metrics & governance** |
| `GET` | `/api/admin/all-data` | **Admin full hospital records oversight** |
