# CareConnect Healthcare Management - PowerShell Launcher
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "           CareConnect Healthcare Management System - Launcher" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

# 1. Set JDK, Maven & Node Paths
$scriptDir = $PSScriptRoot
if (-not (Test-Path "$scriptDir\careconnect-backend\data")) {
    New-Item -ItemType Directory -Path "$scriptDir\careconnect-backend\data" -Force | Out-Null
}
if (-not $env:JAVA_HOME) {
    if (Test-Path "C:\Program Files\Java\jdk-26") {
        $env:JAVA_HOME = "C:\Program Files\Java\jdk-26"
    }
}
$env:PATH = "C:\Users\dixit\.careconnect-tools\apache-maven-3.9.9\bin;C:\Users\dixit\.careconnect-tools\node-v20.18.0-win-x64;$env:JAVA_HOME\bin;" + $env:PATH
$env:MAVEN_OPTS = "-Xms256m -Xmx512m -XX:+UseG1GC"

# 2. Check / Start Backend (Port 8080)
$backendRunning = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "[1/3] Backend is ALREADY running on port 8080." -ForegroundColor Green
} else {
    Write-Host "[1/3] Starting Spring Boot Backend on http://localhost:8080 ..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\careconnect-backend'; Write-Host 'Starting Spring Boot Backend...' -ForegroundColor Cyan; mvn spring-boot:run"
}

# 3. Check / Start Frontend Server (Port 5500)
$frontendRunning = Get-NetTCPConnection -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue
if ($frontendRunning) {
    Write-Host "[2/3] Frontend server is ALREADY running on port 5500." -ForegroundColor Green
} else {
    Write-Host "[2/3] Starting Frontend Server on http://localhost:5500 ..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\careconnect-frontend'; Write-Host 'Starting Frontend Dev Server...' -ForegroundColor Cyan; node server.js"
}

# 4. Wait for services to respond to health check
Write-Host -NoNewline "[3/3] Waiting for CareConnect services to become ready" -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 35; $i++) {
    try {
        $res = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/api/auth/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        # Backend still starting up
    }
    Write-Host -NoNewline "." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}

if ($ready) {
    Write-Host " [READY!]" -ForegroundColor Green
} else {
    Write-Host " [Notice: Services still starting in background]" -ForegroundColor Yellow
}

Write-Host "`nOpening browser at http://localhost:5500 ..." -ForegroundColor Yellow
Start-Process "http://localhost:5500"

Write-Host "`n===============================================================================" -ForegroundColor Cyan
Write-Host " CareConnect is now active!" -ForegroundColor Green
Write-Host " - Live Portal:       http://localhost:5500"
Write-Host " - Backend Direct:    http://localhost:8080"
Write-Host " - REST API Health:   http://localhost:8080/api/auth/health"
Write-Host " - DB Console:        http://localhost:8080/h2-console"
Write-Host "===============================================================================" -ForegroundColor Cyan
