-- ============================================================================
-- CareConnect Enterprise EHR & Hospital Management System
-- Oracle Database 19c / 21c DDL Schema Script
-- Prepared for College Submission & Database Project Defense
-- ============================================================================

-- 1. DROP EXISTING CONSTRAINTS & TABLES IF PRESENT
BEGIN
   FOR cur_rec IN (SELECT table_name FROM user_tables WHERE table_name IN ('PRESCRIPTIONS', 'MEDICAL_REPORTS', 'APPOINTMENTS', 'PATIENTS', 'DOCTORS', 'USERS')) LOOP
      EXECUTE IMMEDIATE 'DROP TABLE ' || cur_rec.table_name || ' CASCADE CONSTRAINTS';
   END LOOP;
END;
/

-- 2. CREATE USERS TABLE
CREATE TABLE USERS (
    user_id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name             VARCHAR2(100) NOT NULL,
    email            VARCHAR2(150) NOT NULL UNIQUE,
    password         VARCHAR2(255) NOT NULL,
    role             VARCHAR2(20) NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    phone            VARCHAR2(20),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. CREATE DOCTORS TABLE
CREATE TABLE DOCTORS (
    doctor_id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          NUMBER NOT NULL UNIQUE,
    specialization   VARCHAR2(100) NOT NULL,
    qualification    VARCHAR2(100) NOT NULL,
    experience       VARCHAR2(50) NOT NULL,
    fee              VARCHAR2(30) NOT NULL,
    available_days   VARCHAR2(100) NOT NULL,
    bio              VARCHAR2(1000),
    CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- 4. CREATE PATIENTS TABLE
CREATE TABLE PATIENTS (
    patient_id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          NUMBER NOT NULL UNIQUE,
    age              NUMBER(3),
    gender           VARCHAR2(15),
    blood_group      VARCHAR2(10),
    allergies        VARCHAR2(255),
    emergency_contact VARCHAR2(30),
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- 5. CREATE APPOINTMENTS TABLE
CREATE TABLE APPOINTMENTS (
    appointment_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id       NUMBER NOT NULL,
    doctor_id        NUMBER NOT NULL,
    appointment_date VARCHAR2(20) NOT NULL,
    time_slot        VARCHAR2(20) NOT NULL,
    status           VARCHAR2(20) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'COMPLETED', 'CANCELLED')),
    symptoms         VARCHAR2(500),
    notes            VARCHAR2(500),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id) ON DELETE CASCADE
);

-- 6. CREATE MEDICAL_REPORTS TABLE
CREATE TABLE MEDICAL_REPORTS (
    report_id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id       NUMBER NOT NULL,
    doctor_id        NUMBER NOT NULL,
    title            VARCHAR2(200) NOT NULL,
    test_type        VARCHAR2(100) NOT NULL,
    report_date      VARCHAR2(20) NOT NULL,
    description      VARCHAR2(2000),
    file_label       VARCHAR2(150),
    status           VARCHAR2(20) DEFAULT 'REVIEWED' CHECK (status IN ('REVIEWED', 'PENDING')),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_rep_patient FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_rep_doctor FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id) ON DELETE CASCADE
);

-- 7. CREATE PRESCRIPTIONS TABLE
CREATE TABLE PRESCRIPTIONS (
    prescription_id  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id       NUMBER NOT NULL,
    doctor_id        NUMBER NOT NULL,
    diagnosis        VARCHAR2(300) NOT NULL,
    medicines_json   CLOB NOT NULL,
    doctor_notes     VARCHAR2(1000),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_rx_patient FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_rx_doctor FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id) ON DELETE CASCADE
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_email ON USERS(email);
CREATE INDEX idx_appt_patient ON APPOINTMENTS(patient_id);
CREATE INDEX idx_appt_doctor ON APPOINTMENTS(doctor_id);
CREATE INDEX idx_rep_patient ON MEDICAL_REPORTS(patient_id);
CREATE INDEX idx_rx_patient ON PRESCRIPTIONS(patient_id);

COMMIT;
