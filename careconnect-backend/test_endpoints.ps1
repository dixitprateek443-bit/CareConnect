# Test CareConnect Spring Boot REST Endpoints

Write-Host "`n==============================================="
Write-Host "1. Testing Auth Health Endpoint"
Write-Host "==============================================="
$health = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/health" -Method Get
$health | Format-List

Write-Host "`n==============================================="
Write-Host "2. Testing Admin Login"
Write-Host "==============================================="
$adminBody = @{
    email = "admin@careconnect.com"
    password = "admin123"
} | ConvertTo-Json
$adminAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $adminBody -ContentType "application/json"
$adminAuth | Format-List

Write-Host "`n==============================================="
Write-Host "3. Testing Doctor Login"
Write-Host "==============================================="
$docBody = @{
    email = "dr.sharma@careconnect.com"
    password = "doctor123"
} | ConvertTo-Json
$docAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $docBody -ContentType "application/json"
$docAuth | Format-List

Write-Host "`n==============================================="
Write-Host "4. Testing Patient Registration (Sign Up)"
Write-Host "==============================================="
$regBody = @{
    name = "Kavita Rao"
    email = "kavita.rao@example.com"
    password = "securePassword123"
    role = "PATIENT"
    phone = "+91 98444 55667"
    age = 29
    gender = "Female"
    bloodGroup = "B+"
    allergies = "None"
    emergencyContact = "+91 98444 99999"
} | ConvertTo-Json
$regAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"
$regAuth | Format-List

Write-Host "`n==============================================="
Write-Host "5. Doctor List (Accessible by Patient & Public)"
Write-Host "==============================================="
$doctors = Invoke-RestMethod -Uri "http://localhost:8080/api/doctors" -Method Get
Write-Host "Found $($doctors.Count) doctors in directory."
$doctors | Select-Object -Property id, specialization, experience, fee, availableDays | Format-Table

Write-Host "`n==============================================="
Write-Host "6. Patient Reports Access (Patient #1)"
Write-Host "==============================================="
$reports = Invoke-RestMethod -Uri "http://localhost:8080/api/patients/1/reports" -Method Get
Write-Host "Found $($reports.Count) reports for Patient #1."
$reports | Select-Object -Property id, title, testType, reportDate, status | Format-Table

Write-Host "`n==============================================="
Write-Host "7. Doctor Uploads New Patient Report"
Write-Host "==============================================="
$newReportBody = @{
    patientId = 1
    doctorId = 1
    title = "Advanced Lipid Profile & Apolipoprotein Panel"
    testType = "Biochemistry / Cardiovascular"
    reportDate = "2026-09-30"
    description = "Total Cholesterol: 185 mg/dL, HDL: 52 mg/dL, LDL: 104 mg/dL. Normal risk profile."
    fileLabel = "Lipid_Advanced_Profile.pdf"
    status = "REVIEWED"
} | ConvertTo-Json
$uploaded = Invoke-RestMethod -Uri "http://localhost:8080/api/reports" -Method Post -Body $newReportBody -ContentType "application/json"
Write-Host "Uploaded Report ID: $($uploaded.id), Title: $($uploaded.title)"

Write-Host "`n==============================================="
Write-Host "8. Doctor Issues Digital Prescription"
Write-Host "==============================================="
$rxBody = @{
    patientId = 1
    doctorId = 1
    diagnosis = "Essential Hypertension Stage 1"
    medicinesJson = '[{"name":"Telmisartan 40mg","frequency":"1 tab daily morning","notes":"Post breakfast"}]'
    doctorNotes = "Review blood pressure log weekly. Reduce dietary sodium."
} | ConvertTo-Json
$issuedRx = Invoke-RestMethod -Uri "http://localhost:8080/api/prescriptions" -Method Post -Body $rxBody -ContentType "application/json"
Write-Host "Prescription Issued ID: $($issuedRx.id), Diagnosis: $($issuedRx.diagnosis)"

Write-Host "`n==============================================="
Write-Host "9. Admin Clinical Governance Stats"
Write-Host "==============================================="
$stats = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/stats" -Method Get
$stats | Format-List
