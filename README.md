# CareConnect — Patient Records & Healthcare Management System

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17%2B-orange.svg)](https://www.oracle.com/java/)
[![Oracle Database](https://img.shields.io/badge/Oracle%20DB-19c%20%7C%2021c%20%7C%2023c-red.svg)](https://www.oracle.com/database/)
[![Frontend](https://img.shields.io/badge/Frontend-SPA%20%7C%20Vanilla%20JS-blue.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](#)

An enterprise-grade **Electronic Health Record (EHR) and Hospital Management System** bridging patients, specialist physicians, and hospital administration with secure medical records, appointment scheduling, laboratory report management, and digital e-prescriptions.

---

## 🌟 Key Features & Modules

### 1. 🔐 Role-Based Access Control (RBAC) & Authentication
- Role isolation across **Patient**, **Doctor**, and **Hospital Administrator**.
- Unified registration automatically creating clinical profiles and EHR dossiers.
- Self-service **Forgot Password flow** with 6-digit OTP verification.

### 2. 🩺 Specialist Doctor Directory & Workstation
- 10 pre-configured clinical departments: Cardiology, Neurology, Pediatrics, Orthopedics, Dermatology, General Medicine, Gynecology & Obstetrics, Pulmonology, Ophthalmology, Endocrinology.
- Doctor consultation queue management (`PENDING` ➔ `CONFIRMED` ➔ `COMPLETED`).
- Doctor authoring & uploading of verified diagnostic reports.
- Digital e-prescription generation with structured drug dosages and advice.

### 3. 🏥 Patient Health Record (EHR) & Portal
- Full patient dossier: blood groups, known allergies, chronic conditions, emergency contacts.
- Self-service appointment booking with specialist selection and time slots.
- Access to diagnostic reports (Pathology, Radiology, Ultrasound, MRI, CT Scans).
- View, print, and download digital e-prescriptions.

### 4. 📊 Hospital Administration & Governance Console
- Real-time clinical governance metrics and analytics.
- Central audit and record management across all entities.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend API** | Java 17+ / Spring Boot 3.3.4 | RESTful services, Spring Data JPA, Hibernate ORM, Bean Validation |
| **Database** | Oracle Database (19c/21c/23c XE/Free) | Enterprise relational storage via native `ojdbc11` driver |
| **Evaluator Engine** | Embedded Oracle Mode | Zero-configuration evaluation mode with 88+ clinical records pre-seeded |
| **Frontend** | Vanilla JS, Modern CSS3, HTML5 | Responsive Single-Page Application (SPA) with Live Server |
| **Build & Tooling** | Apache Maven 3.9+, Node.js 20+ | Automated build, dependency resolution, and developer server |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java Development Kit (JDK 17 or higher)**
- **Apache Maven 3.9+**
- **Node.js 18+** (for frontend live server)
- *(Optional)* **Oracle Database 19c / 21c / 23c** (or use the built-in Oracle mode engine)

---

### Step 1: Start the Spring Boot Backend

```bash
cd careconnect-backend
mvn spring-boot:run
```
- **Backend API**: `http://localhost:8080/api`
- **Interactive DB Console**: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:mem:careconnectdb;MODE=Oracle`
  - Username: `careconnect`
  - Password: `careconnect123`

---

### Step 2: Start the Frontend Live Server

In a new terminal window:
```bash
cd careconnect-frontend
node server.js
```
- **Live Portal**: `http://localhost:5500`

---

### Step 3: (Optional) Connect with Native Oracle Database

1. Execute the complete DDL & DML script in **Oracle SQL Developer** or **SQL\*Plus**:
   - File: [`oracle-schema-and-data.sql`](oracle-schema-and-data.sql)
2. Run Spring Boot with the `oracle` profile:
   ```bash
   cd careconnect-backend
   mvn spring-boot:run -Dspring-boot.run.profiles=oracle
   ```
3. Or configure environment variables:
   ```bash
   export ORACLE_URL="jdbc:oracle:thin:@localhost:1521/XEPDB1"
   export ORACLE_USER="c##careconnect"
   export ORACLE_PASSWORD="YourPassword123#"
   mvn spring-boot:run -Dspring-boot.run.profiles=oracle
   ```

---

## 🔑 Demo Test Credentials

| Role | Email | Password | Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@careconnect.com` | `admin123` | Full system analytics & governance |
| **Cardiologist** | `dr.sharma@careconnect.com` | `doctor123` | Active consultation queue & prescriptions |
| **Neurologist** | `dr.patel@careconnect.com` | `doctor123` | Patient reports & migraine protocols |
| **Patient 1** | `rahul.verma@careconnect.com` | `patient123` | CBC lab report, 2D Echo, cardiac prescription |
| **Patient 2** | `sneha.k@careconnect.com` | `patient123` | Brain MRI report, migraine prescription |

---

## 📂 Repository Structure

```
CareConnect/
├── .vscode/                             # VS Code workspace & Live Server settings
├── .gitignore                           # Git ignore for Maven, Node, and IDE artifacts
├── README.md                            # Main project overview & documentation
├── index.html                           # Root auto-redirect to frontend portal
├── oracle-schema-and-data.sql           # Complete Oracle DDL & 50+ clinical records DML
├── CareConnect_Module_Documentation.md  # Detailed software module specification
├── careconnect-backend/                 # Spring Boot 3 Java Backend
│   ├── pom.xml                          # Maven build dependencies (Spring Boot, ojdbc11, JPA)
│   ├── README.md                        # Backend documentation
│   ├── test_endpoints.ps1               # Automated REST API test script
│   └── src/
│       ├── main/java/com/careconnect/   # Controllers, Entities, Repositories, Services, DTOs
│       └── main/resources/
│           ├── application.properties   # Default Oracle-mode configuration
│           ├── application-oracle.properties # Native Oracle 19c/21c profile
│           └── oracle-schema-and-data.sql    # Oracle DDL & DML script
└── careconnect-frontend/                # Client Single-Page Application
    ├── index.html                       # Semantic HTML5 clinical portal layout
    ├── styles.css                       # Modern medical UI design system
    ├── app.js                           # Frontend controller, routing, and REST integration
    ├── server.js                        # Node.js Live Server (Port 5500)
    └── package.json                     # Frontend metadata
```

---

## 📡 Core REST Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate & retrieve role-based token |
| `POST` | `/api/auth/register` | Self-register Patient, Doctor, or Admin |
| `POST` | `/api/auth/forgot-password` | Generate & verify 6-digit OTP for password reset |
| `POST` | `/api/auth/reset-password` | Set new password with validated OTP |
| `GET` | `/api/doctors` | Browse all 10 specialist doctors |
| `GET` | `/api/patients/{id}/reports` | Patient accesses diagnostic lab & radiology reports |
| `GET` | `/api/patients/{id}/prescriptions` | Patient accesses digital e-prescriptions |
| `POST` | `/api/appointments` | Book consultation slot with specialist |
| `PATCH`| `/api/appointments/{id}/status` | Doctor updates appointment status |
| `POST` | `/api/reports` | Doctor uploads patient diagnostic report |
| `POST` | `/api/prescriptions` | Doctor issues digital e-prescription |
| `GET` | `/api/admin/stats` | Hospital clinical governance analytics |

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
