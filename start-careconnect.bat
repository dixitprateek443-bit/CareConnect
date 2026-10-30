@echo off
setlocal enabledelayedexpansion
title CareConnect Healthcare Management - Launcher
color 0b

echo ===============================================================================
echo            CareConnect Healthcare Management System - Launcher
echo ===============================================================================

:: 1. Navigate to script directory regardless of where it was launched
cd /d "%~dp0"
if not exist "%~dp0careconnect-backend\data" mkdir "%~dp0careconnect-backend\data"

:: 2. Set Tool Paths and Environment
if not defined JAVA_HOME (
    if exist "C:\Program Files\Java\jdk-26" set "JAVA_HOME=C:\Program Files\Java\jdk-26"
)
set "PATH=C:\Users\dixit\.careconnect-tools\apache-maven-3.9.9\bin;C:\Users\dixit\.careconnect-tools\node-v20.18.0-win-x64;%JAVA_HOME%\bin;%PATH%"
set MAVEN_OPTS=-Xms256m -Xmx512m -XX:+UseG1GC

:: 3. Check / Start Backend (Port 8080)
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [1/3] Backend is ALREADY running on port 8080.
) else (
    echo [1/3] Starting Spring Boot Backend on http://localhost:8080 ...
    start "CareConnect Backend (Spring Boot 3.3.4)" cmd /k "cd /d ""%~dp0careconnect-backend"" && echo Starting Backend... && mvn spring-boot:run"
)

:: 4. Check / Start Frontend Server (Port 5500)
netstat -ano | findstr ":5500" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [2/3] Frontend server is ALREADY running on port 5500.
) else (
    echo [2/3] Starting Frontend Server on http://localhost:5500 ...
    start "CareConnect Frontend (Node Server)" cmd /k "cd /d ""%~dp0careconnect-frontend"" && echo Starting Frontend... && node server.js"
)

:: 5. Health Check Poll Loop (Wait for Backend to be 100% Ready)
echo.
<nul set /p=[3/3] Waiting for CareConnect services to become ready
set attempts=0

:poll_loop
set /a attempts+=1
for /f "tokens=*" %%g in ('curl.exe -s -o nul -w "%%{http_code}" http://127.0.0.1:8080/api/auth/health 2^>nul') do set HTTP_CODE=%%g
if "%HTTP_CODE%"=="200" goto services_ready
if %attempts% geq 35 goto services_timeout
<nul set /p=.
timeout /t 1 >nul
goto poll_loop

:services_ready
echo  [READY!]
goto open_portal

:services_timeout
echo  [Notice: Services still starting in background]

:open_portal
echo.
echo Launching Web Browser at http://localhost:5500 ...
start http://localhost:5500

echo ===============================================================================
echo  CareConnect is now active!
echo  - Live Portal:       http://localhost:5500
echo  - Backend Direct:    http://localhost:8080
echo  - REST API Health:   http://localhost:8080/api/auth/health
echo  - H2 DB Console:     http://localhost:8080/h2-console
echo.
echo  * You can bookmark http://localhost:5500 in your browser.
echo ===============================================================================
pause
