package com.careconnect.util;

import com.careconnect.entity.*;
import com.careconnect.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalReportRepository reportRepository;
    private final PrescriptionRepository prescriptionRepository;

    public DataInitializer(UserRepository userRepository,
                           DoctorRepository doctorRepository,
                           PatientRepository patientRepository,
                           AppointmentRepository appointmentRepository,
                           MedicalReportRepository reportRepository,
                           PrescriptionRepository prescriptionRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.reportRepository = reportRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // Data already initialized
        }

        // ====================================================================
        // 1. ADMIN USER (1 record)
        // ====================================================================
        User adminUser = new User("System Administrator", "admin@careconnect.com", "admin123", Role.ADMIN, "+91 98765 00001");
        userRepository.save(adminUser);

        // ====================================================================
        // 2. DOCTOR USERS & PROFILES (10 records)
        // ====================================================================
        List<User> doctorUsers = List.of(
            new User("Dr. Rajesh Sharma", "dr.sharma@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 11111"),
            new User("Dr. Priya Patel", "dr.patel@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 22222"),
            new User("Dr. Anita Roy", "dr.roy@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 33333"),
            new User("Dr. Vikram Seth", "dr.seth@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 44444"),
            new User("Dr. Kavita Nair", "dr.nair@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 55555"),
            new User("Dr. Arjun Sengupta", "dr.sengupta@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 66666"),
            new User("Dr. Meera Nambiar", "dr.nambiar@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 77777"),
            new User("Dr. Sandeep Verma", "dr.verma@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 88888"),
            new User("Dr. Ritu Deshmukh", "dr.deshmukh@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 99999"),
            new User("Dr. Alok Mathur", "dr.mathur@careconnect.com", "doctor123", Role.DOCTOR, "+91 98765 10101")
        );
        userRepository.saveAll(doctorUsers);

        List<Doctor> doctors = List.of(
            new Doctor(doctorUsers.get(0), "Cardiology", "MD, DM (Cardiology), FACC", "14+ Years", "$90", "Mon, Wed, Fri", "Senior Interventional Cardiologist specializing in coronary intervention, hypertension management, and preventative cardiac care."),
            new Doctor(doctorUsers.get(1), "Neurology", "MBBS, MD, DM (Neurology)", "11+ Years", "$85", "Tue, Thu, Sat", "Consultant Neurologist specializing in stroke rehabilitation, migraine management, and neuro-muscular disorders."),
            new Doctor(doctorUsers.get(2), "Pediatrics", "MBBS, DCH, DNB (Pediatrics)", "9+ Years", "$60", "Mon - Fri", "Compassionate pediatric care focusing on neonatal care, childhood immunization, and developmental milestones."),
            new Doctor(doctorUsers.get(3), "Orthopedics", "MS (Ortho), MCh, Fellowship UK", "16+ Years", "$95", "Mon, Wed, Sat", "Specialist in joint replacement surgery, arthroscopic reconstruction, and sports injury rehabilitation."),
            new Doctor(doctorUsers.get(4), "Dermatology", "MBBS, MD (Dermatology)", "8+ Years", "$70", "Tue, Thu, Fri", "Clinical and aesthetic dermatologist specializing in eczema, psoriasis, acne management, and allergy patch testing."),
            new Doctor(doctorUsers.get(5), "General Medicine", "MBBS, MD (Internal Medicine)", "13+ Years", "$65", "Mon - Sat", "Consultant physician managing metabolic syndrome, diabetes mellitus, geriatric health, and acute adult infections."),
            new Doctor(doctorUsers.get(6), "Gynecology & Obstetrics", "MBBS, MS (OBG), MRCOG", "12+ Years", "$80", "Mon, Wed, Fri", "Senior Obstetrician and Gynecologist dedicated to high-risk maternity care and laparoscopic surgery."),
            new Doctor(doctorUsers.get(7), "Pulmonology", "MBBS, MD (Pulmonary Medicine)", "10+ Years", "$75", "Tue, Thu, Sat", "Chest and respiratory specialist focusing on bronchial asthma, COPD, pulmonary fibrosis, and sleep apnea."),
            new Doctor(doctorUsers.get(8), "Ophthalmology", "MBBS, MS (Ophthalmology), FICO", "7+ Years", "$65", "Mon, Tue, Thu", "Eye surgeon specializing in refractive laser procedures, cataract surgery, and diabetic retinopathy care."),
            new Doctor(doctorUsers.get(9), "Endocrinology", "MBBS, MD, DM (Endocrinology)", "15+ Years", "$90", "Wed, Fri, Sat", "Endocrinologist focused on complex type 1 & 2 diabetes, thyroid diseases, and endocrine hormone disorders.")
        );
        doctorRepository.saveAll(doctors);

        // ====================================================================
        // 3. PATIENT USERS & PROFILES (15 records)
        // ====================================================================
        List<User> patientUsers = List.of(
            new User("Rahul Verma", "rahul.verma@careconnect.com", "patient123", Role.PATIENT, "+91 98111 22334"),
            new User("Sneha Kulkarni", "sneha.k@careconnect.com", "patient123", Role.PATIENT, "+91 98222 33445"),
            new User("Aman Gupta", "aman.g@careconnect.com", "patient123", Role.PATIENT, "+91 98333 44556"),
            new User("Pooja Iyer", "pooja.iyer@careconnect.com", "patient123", Role.PATIENT, "+91 98444 55667"),
            new User("Karan Malhotra", "karan.m@careconnect.com", "patient123", Role.PATIENT, "+91 98555 66778"),
            new User("Divya Nair", "divya.n@careconnect.com", "patient123", Role.PATIENT, "+91 98666 77889"),
            new User("Vikramaditya Rao", "vikram.rao@careconnect.com", "patient123", Role.PATIENT, "+91 98777 88990"),
            new User("Ananya Sen", "ananya.sen@careconnect.com", "patient123", Role.PATIENT, "+91 98888 99001"),
            new User("Manish Tiwari", "manish.t@careconnect.com", "patient123", Role.PATIENT, "+91 98999 00112"),
            new User("Roshni Mehta", "roshni.m@careconnect.com", "patient123", Role.PATIENT, "+91 98123 45678"),
            new User("Gaurav Bhatt", "gaurav.b@careconnect.com", "patient123", Role.PATIENT, "+91 98234 56789"),
            new User("Sunita Saxena", "sunita.s@careconnect.com", "patient123", Role.PATIENT, "+91 98345 67890"),
            new User("Deepak Chopra", "deepak.c@careconnect.com", "patient123", Role.PATIENT, "+91 98456 78901"),
            new User("Shreya Joshi", "shreya.j@careconnect.com", "patient123", Role.PATIENT, "+91 98567 89012"),
            new User("Rameshwar Pandey", "ramesh.p@careconnect.com", "patient123", Role.PATIENT, "+91 98678 90123")
        );
        userRepository.saveAll(patientUsers);

        List<Patient> patients = List.of(
            new Patient(patientUsers.get(0), 32, "Male", "O+", "Penicillin", "+91 98111 99999"),
            new Patient(patientUsers.get(1), 28, "Female", "A+", "Dust, Pollen", "+91 98222 88888"),
            new Patient(patientUsers.get(2), 45, "Male", "B+", "Sulfa Drugs", "+91 98333 77777"),
            new Patient(patientUsers.get(3), 35, "Female", "AB+", "None", "+91 98444 66666"),
            new Patient(patientUsers.get(4), 52, "Male", "O-", "Aspirin", "+91 98555 55555"),
            new Patient(patientUsers.get(5), 24, "Female", "B-", "Lactose, Peanuts", "+91 98666 44444"),
            new Patient(patientUsers.get(6), 60, "Male", "A-", "Iodinated Contrast", "+91 98777 33333"),
            new Patient(patientUsers.get(7), 30, "Female", "AB-", "None", "+91 98888 22222"),
            new Patient(patientUsers.get(8), 41, "Male", "O+", "None", "+91 98999 11111"),
            new Patient(patientUsers.get(9), 27, "Female", "B+", "Latex", "+91 98123 99991"),
            new Patient(patientUsers.get(10), 38, "Male", "A+", "NSAIDs (Ibuprofen)", "+91 98234 99992"),
            new Patient(patientUsers.get(11), 55, "Female", "O+", "Shellfish", "+91 98345 99993"),
            new Patient(patientUsers.get(12), 48, "Male", "B+", "None", "+91 98456 99994"),
            new Patient(patientUsers.get(13), 22, "Female", "AB+", "Amoxicillin", "+91 98567 99995"),
            new Patient(patientUsers.get(14), 65, "Male", "O+", "Ciprofloxacin", "+91 98678 99996")
        );
        patientRepository.saveAll(patients);

        // ====================================================================
        // 4. APPOINTMENTS (15 records)
        // ====================================================================
        List<Appointment> appointments = List.of(
            new Appointment(patients.get(0), doctors.get(0), "2026-10-05", "10:30 AM", "CONFIRMED", "Chest tightness during exercise", "Please bring previous ECG reports"),
            new Appointment(patients.get(1), doctors.get(1), "2026-10-06", "11:15 AM", "CONFIRMED", "Frequent migraines with visual aura", "Fasting not required"),
            new Appointment(patients.get(2), doctors.get(3), "2026-10-08", "02:00 PM", "CONFIRMED", "Right knee swelling after running", "Wear comfortable clothing"),
            new Appointment(patients.get(3), doctors.get(4), "2026-10-09", "03:30 PM", "CONFIRMED", "Persistent dry skin rash on forearms", "Avoid topical creams on morning of visit"),
            new Appointment(patients.get(4), doctors.get(0), "2026-10-10", "09:30 AM", "CONFIRMED", "Routine cardiac checkup and BP review", "Fasting lipid panel to be drawn"),
            new Appointment(patients.get(5), doctors.get(2), "2026-10-10", "11:00 AM", "CONFIRMED", "Pediatric wellness exam & vaccination", "Bring child immunization record booklet"),
            new Appointment(patients.get(6), doctors.get(5), "2026-10-11", "10:00 AM", "CONFIRMED", "Uncontrolled blood sugar levels", "Bring home glucometer log for 2 weeks"),
            new Appointment(patients.get(7), doctors.get(6), "2026-10-12", "12:00 PM", "CONFIRMED", "Second trimester routine antenatal checkup", "USG scan scheduled prior to appointment"),
            new Appointment(patients.get(8), doctors.get(7), "2026-10-13", "02:30 PM", "CONFIRMED", "Chronic nocturnal dry cough and wheezing", "Spirometry test planned"),
            new Appointment(patients.get(9), doctors.get(8), "2026-10-14", "11:30 AM", "CONFIRMED", "Blurred distant vision and eye strain", "Do not drive if pupil dilation required"),
            new Appointment(patients.get(10), doctors.get(9), "2026-10-15", "04:00 PM", "CONFIRMED", "Thyroid nodule follow-up consultation", "Review recent serum TSH / Free T4"),
            new Appointment(patients.get(11), doctors.get(1), "2026-10-16", "10:30 AM", "CONFIRMED", "Peripheral neuropathy & tingling in feet", "Nerve conduction study results pending"),
            new Appointment(patients.get(12), doctors.get(3), "2026-10-17", "03:00 PM", "CONFIRMED", "Lower back pain radiating down left thigh", "Lumbar spine MRI advised"),
            new Appointment(patients.get(13), doctors.get(5), "2026-10-18", "09:00 AM", "CONFIRMED", "Recurrent fatigue and low energy levels", "Complete metabolic panel ordered"),
            new Appointment(patients.get(14), doctors.get(7), "2026-10-19", "01:30 PM", "CONFIRMED", "Exertional shortness of breath on climbing", "Oxygen saturation and chest X-ray needed")
        );
        appointmentRepository.saveAll(appointments);

        // ====================================================================
        // 5. MEDICAL REPORTS (12 records)
        // ====================================================================
        List<MedicalReport> reports = List.of(
            new MedicalReport(patients.get(0), doctors.get(0), "Complete Blood Count (CBC) & Metabolic Panel", "Pathology / Hematology", "2026-09-22", "All parameters within optimal range. Hemoglobin: 14.8 g/dL, Platelets: 240,000/uL, Fasting Blood Glucose: 92 mg/dL.", "CBC_Comprehensive_Panel.pdf", "REVIEWED"),
            new MedicalReport(patients.get(0), doctors.get(0), "2D Echocardiography & Resting ECG", "Cardiology Diagnostic", "2026-09-25", "Normal LV systolic function. Ejection Fraction: 62%. Normal valvular structure. No regional wall motion abnormality.", "Echocardiogram_Summary.pdf", "REVIEWED"),
            new MedicalReport(patients.get(1), doctors.get(1), "Brain MRI with Contrast Angiography", "Radiology / Neuroimaging", "2026-09-20", "No evidence of acute intracranial pathology, ischemic injury, or mass effect. Normal cerebral vasculature.", "Brain_MRI_Neuro_Report.pdf", "REVIEWED"),
            new MedicalReport(patients.get(2), doctors.get(3), "Right Knee High-Resolution MRI", "Orthopedic Radiology", "2026-09-27", "Grade 1 medial meniscus sprain without displacement. Cruciate ligaments intact. Mild joint effusion noted.", "Knee_MRI_Imaging.pdf", "REVIEWED"),
            new MedicalReport(patients.get(4), doctors.get(0), "Advanced Lipid Profile & Apolipoprotein Panel", "Cardiovascular Biochemistry", "2026-09-28", "Total Cholesterol: 215 mg/dL, HDL: 44 mg/dL, LDL: 138 mg/dL, Triglycerides: 165 mg/dL. Moderate hyperlipidemia.", "Lipid_Advanced_Profile.pdf", "REVIEWED"),
            new MedicalReport(patients.get(6), doctors.get(5), "Glycated Hemoglobin (HbA1c) & Fasting Insulin", "Endocrine Pathology", "2026-09-29", "HbA1c: 7.8% (Target < 7.0%). Fasting Blood Glucose: 162 mg/dL. Glycemic control requires pharmacotherapy adjustment.", "HbA1c_Glycemic_Report.pdf", "REVIEWED"),
            new MedicalReport(patients.get(7), doctors.get(6), "Targeted 2nd Trimester Anomaly Ultrasound Scan", "Obstetric Sonography", "2026-09-26", "Single live fetus in cephalic presentation. Anatomical survey normal. Amniotic fluid index: 14.5 cm (Adequate).", "Fetal_Anomaly_USG.pdf", "REVIEWED"),
            new MedicalReport(patients.get(8), doctors.get(7), "Pre & Post Bronchodilator Spirometry", "Pulmonary Diagnostics", "2026-09-24", "FEV1/FVC ratio: 68%. Significant bronchodilator reversibility (+14% post-salbutamol). Consistent with bronchial asthma.", "Spirometry_PFT_Report.pdf", "REVIEWED"),
            new MedicalReport(patients.get(10), doctors.get(9), "High-Resolution Thyroid Ultrasound & Serum TSH", "Endocrine Diagnostics", "2026-09-23", "Serum TSH: 5.6 uIU/mL (Mildly elevated). Right lobe 0.8cm benign-appearing colloid cyst (TIRADS 2).", "Thyroid_Ultrasound_TSH.pdf", "REVIEWED"),
            new MedicalReport(patients.get(11), doctors.get(1), "Electromyography & Nerve Conduction Study (EMG/NCS)", "Neurophysiology", "2026-09-21", "Mild bilateral sensory peripheral polyneuropathy in lower extremities. Sural nerve conduction velocity: 38 m/s.", "EMG_NCS_Electrophysiology.pdf", "REVIEWED"),
            new MedicalReport(patients.get(12), doctors.get(3), "Lumbosacral Spine Digital X-Ray & MRI", "Spinal Imaging", "2026-09-26", "L4-L5 mild posterior disc bulge with minimal thecal sac indentation. No neural foraminal impingement.", "LS_Spine_MRI_Scan.pdf", "REVIEWED"),
            new MedicalReport(patients.get(14), doctors.get(7), "High-Resolution Computed Tomography (HRCT) Chest", "Thoracic Radiology", "2026-09-27", "Subcentimeter calcified granuloma in right middle lobe. No interstitial lung disease or active infiltrates.", "HRCT_Chest_Imaging.pdf", "REVIEWED")
        );
        reportRepository.saveAll(reports);

        // ====================================================================
        // 6. DIGITAL PRESCRIPTIONS (10 records)
        // ====================================================================
        List<Prescription> prescriptions = List.of(
            new Prescription(
                patients.get(0), doctors.get(0),
                "Mild Exertional Angina & Preventative Cardiac Management",
                "[{\"name\":\"Atorvastatin 10mg\",\"frequency\":\"1 tablet at bedtime\",\"notes\":\"Lipid management\"},{\"name\":\"Metoprolol 25mg\",\"frequency\":\"1 tablet morning after food\",\"notes\":\"Cardioprotective therapy\"}]",
                "Maintain low-sodium Mediterranean diet. 30 mins brisk walking daily. Repeat lipid profile in 8 weeks."
            ),
            new Prescription(
                patients.get(1), doctors.get(1),
                "Migraine Prophylaxis & Acute Pain Management",
                "[{\"name\":\"Propranolol 40mg\",\"frequency\":\"1 tablet once daily morning\",\"notes\":\"Migraine prophylaxis\"},{\"name\":\"Naproxen 500mg\",\"frequency\":\"1 tablet at onset of migraine headache\",\"notes\":\"Take with antacid\"}]",
                "Maintain regular sleep hours. Avoid excessive caffeine and aged cheeses. Keep a migraine trigger diary."
            ),
            new Prescription(
                patients.get(2), doctors.get(3),
                "Acute Meniscal Strain & Joint Inflammation",
                "[{\"name\":\"Aceclofenac 100mg + Paracetamol 325mg\",\"frequency\":\"1 tablet twice daily after meals\",\"notes\":\"Anti-inflammatory (5 days)\"},{\"name\":\"Collagen Peptide + Glucosamine Sachets\",\"frequency\":\"1 sachet daily in water\",\"notes\":\"Cartilage support (30 days)\"}]",
                "Apply cold ice packs for 15 mins thrice daily. Avoid deep squatting and running for 3 weeks. Physiotherapy recommended."
            ),
            new Prescription(
                patients.get(3), doctors.get(4),
                "Chronic Eczema & Pruritic Dermatitis",
                "[{\"name\":\"Desonide 0.05% Cream\",\"frequency\":\"Apply thin layer twice daily\",\"notes\":\"Topical corticosteroid (7 days)\"},{\"name\":\"Levocetirizine 5mg\",\"frequency\":\"1 tablet at night\",\"notes\":\"Antihistamine for itching\"}]",
                "Use fragrance-free hypoallergenic moisturizers immediately after bathing. Avoid harsh wool clothing."
            ),
            new Prescription(
                patients.get(4), doctors.get(0),
                "Essential Hypertension Stage 1 & Dyslipidemia",
                "[{\"name\":\"Telmisartan 40mg\",\"frequency\":\"1 tablet morning post-breakfast\",\"notes\":\"Antihypertensive therapy\"},{\"name\":\"Rosuvastatin 10mg\",\"frequency\":\"1 tablet at night\",\"notes\":\"HMG-CoA reductase inhibitor\"}]",
                "Reduce dietary table salt to < 3 grams daily. Check and record blood pressure weekly in CareConnect app."
            ),
            new Prescription(
                patients.get(6), doctors.get(5),
                "Type 2 Diabetes Mellitus - Dual Oral Therapy",
                "[{\"name\":\"Metformin 1000mg SR\",\"frequency\":\"1 tablet twice daily with lunch & dinner\",\"notes\":\"Insulin sensitizer\"},{\"name\":\"Dapagliflozin 10mg\",\"frequency\":\"1 tablet once daily morning\",\"notes\":\"SGLT2 inhibitor\"}]",
                "Maintain low-glycemic index diet. Exercise 150 minutes per week. Repeat HbA1c test in 3 months."
            ),
            new Prescription(
                patients.get(8), doctors.get(7),
                "Moderate Persistent Bronchial Asthma",
                "[{\"name\":\"Budesonide 200mcg + Formoterol 6mcg Inhaler\",\"frequency\":\"2 puffs twice daily morning and evening\",\"notes\":\"Maintenance inhaler with spacer\"},{\"name\":\"Montelukast 10mg\",\"frequency\":\"1 tablet at bedtime\",\"notes\":\"Leukotriene receptor antagonist\"}]",
                "Rinse mouth with water after inhalation. Always carry rescue inhaler (Salbutamol) when traveling."
            ),
            new Prescription(
                patients.get(10), doctors.get(9),
                "Subclinical Hypothyroidism",
                "[{\"name\":\"Levothyroxine Sodium 25mcg\",\"frequency\":\"1 tablet early morning empty stomach\",\"notes\":\"Take with plain water 45 mins before tea/breakfast\"}]",
                "Do not take calcium or iron supplements within 4 hours of levothyroxine. Repeat serum TSH in 6 weeks."
            ),
            new Prescription(
                patients.get(11), doctors.get(1),
                "Peripheral Neuropathy & Neuropathic Pain",
                "[{\"name\":\"Pregabalin 75mg\",\"frequency\":\"1 capsule at bedtime\",\"notes\":\"Neuropathic pain relief\"},{\"name\":\"Methylcobalamin 1500mcg + Alpha Lipoic Acid\",\"frequency\":\"1 tablet daily after food\",\"notes\":\"Nerve regeneration supplement\"}]",
                "Inspect feet daily for cuts or blisters. Wear soft cushioned footwear at all times."
            ),
            new Prescription(
                patients.get(12), doctors.get(3),
                "Lumbosacral Radiculopathy & Muscle Spasm",
                "[{\"name\":\"Thiocolchicoside 4mg + Aceclofenac 100mg\",\"frequency\":\"1 tablet twice daily after meals\",\"notes\":\"Muscle relaxant & analgesic (5 days)\"},{\"name\":\"Rabeprazole 20mg\",\"frequency\":\"1 tablet once daily before breakfast\",\"notes\":\"Gastric protection\"}]",
                "Avoid bending forward at the waist. Practice core strengthening and lumbar stabilization exercises with physiotherapist."
            )
        );
        prescriptionRepository.saveAll(prescriptions);

        System.out.println("==================================================================");
        System.out.println(">>> CareConnect Oracle Clinical Dataset Initialized Successfully! <<<");
        System.out.println(">>> Total Entities Seeded: " + 
            (1 + doctorUsers.size() + doctors.size() + patientUsers.size() + patients.size() + 
             appointments.size() + reports.size() + prescriptions.size()) + " records! <<<");
        System.out.println("==================================================================");
    }
}
