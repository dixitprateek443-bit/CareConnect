# Test Registration and Login for Doctor and Admin

Write-Host "=== 1. Test Doctor Registration via API ==="
$docReg = @{
    name = "Dr. Sameer Joshi"
    email = "dr.joshi@careconnect.com"
    password = "doctorPassword123"
    role = "DOCTOR"
    phone = "+91 98999 44556"
    specialization = "ENT Specialist"
    qualification = "MBBS, MS (ENT)"
    experience = "9+ Years"
    fee = "Rs 900"
    availableDays = "Mon, Wed, Fri - 11:00 to 16:00"
    bio = "Senior ENT surgeon specializing in otology and sinus disorders."
} | ConvertTo-Json

$docRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $docReg -ContentType "application/json"
Write-Host "Doctor Registered: $($docRes.name), DoctorId: $($docRes.doctorId), Role: $($docRes.role)"

Write-Host "`n=== 2. Test Doctor Login with New Account ==="
$docLogin = @{
    email = "dr.joshi@careconnect.com"
    password = "doctorPassword123"
} | ConvertTo-Json
$docLogRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $docLogin -ContentType "application/json"
Write-Host "Doctor Login Successful! Token: $($docLogRes.token), Name: $($docLogRes.name), Role: $($docLogRes.role)"

Write-Host "`n=== 3. Test Admin Registration via API ==="
$admReg = @{
    name = "Pooja Malhotra"
    email = "p.malhotra@careconnect.com"
    password = "adminPassword123"
    role = "ADMIN"
    phone = "+91 98777 66554"
} | ConvertTo-Json

$admRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $admReg -ContentType "application/json"
Write-Host "Admin Registered: $($admRes.name), Role: $($admRes.role)"

Write-Host "`n=== 4. Test Admin Login with New Account ==="
$admLogin = @{
    email = "p.malhotra@careconnect.com"
    password = "adminPassword123"
} | ConvertTo-Json
$admLogRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $admLogin -ContentType "application/json"
Write-Host "Admin Login Successful! Token: $($admLogRes.token), Name: $($admLogRes.name), Role: $($admLogRes.role)"
