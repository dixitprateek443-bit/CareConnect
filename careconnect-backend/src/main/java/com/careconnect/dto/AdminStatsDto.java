package com.careconnect.dto;

public class AdminStatsDto {

    private long totalDoctors;
    private long totalPatients;
    private long totalAppointments;
    private long totalReports;
    private long totalPrescriptions;
    private String databaseEngine;
    private String systemStatus;

    public AdminStatsDto() {}

    public AdminStatsDto(long totalDoctors, long totalPatients, long totalAppointments, long totalReports, long totalPrescriptions, String databaseEngine, String systemStatus) {
        this.totalDoctors = totalDoctors;
        this.totalPatients = totalPatients;
        this.totalAppointments = totalAppointments;
        this.totalReports = totalReports;
        this.totalPrescriptions = totalPrescriptions;
        this.databaseEngine = databaseEngine;
        this.systemStatus = systemStatus;
    }

    public long getTotalDoctors() { return totalDoctors; }
    public void setTotalDoctors(long totalDoctors) { this.totalDoctors = totalDoctors; }

    public long getTotalPatients() { return totalPatients; }
    public void setTotalPatients(long totalPatients) { this.totalPatients = totalPatients; }

    public long getTotalAppointments() { return totalAppointments; }
    public void setTotalAppointments(long totalAppointments) { this.totalAppointments = totalAppointments; }

    public long getTotalReports() { return totalReports; }
    public void setTotalReports(long totalReports) { this.totalReports = totalReports; }

    public long getTotalPrescriptions() { return totalPrescriptions; }
    public void setTotalPrescriptions(long totalPrescriptions) { this.totalPrescriptions = totalPrescriptions; }

    public String getDatabaseEngine() { return databaseEngine; }
    public void setDatabaseEngine(String databaseEngine) { this.databaseEngine = databaseEngine; }

    public String getSystemStatus() { return systemStatus; }
    public void setSystemStatus(String systemStatus) { this.systemStatus = systemStatus; }
}
