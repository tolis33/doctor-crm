using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Stomadiagnosis.Host.Data;
using Stomadiagnosis.Host.Models;

namespace Stomadiagnosis.Host.Controllers;

public static class AppointmentEndpoints
{
    public static void MapAppointmentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/appointments").WithTags("Appointments");

        // GET /api/appointments
        group.MapGet("/", async (StomadiagnosisDbContext db) =>
        {
            return await db.Appointments
                .Include(a => a.Patient)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();
        })
        .WithName("GetAppointments");

        // GET /api/appointments/{id}
        group.MapGet("/{id:int}", async (int id, StomadiagnosisDbContext db) =>
        {
            var appointment = await db.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);

            return appointment is not null ? Results.Ok(appointment) : Results.NotFound();
        })
        .WithName("GetAppointmentById");

        // GET /api/appointments/patient/{patientId}
        group.MapGet("/patient/{patientId:int}", async (int patientId, StomadiagnosisDbContext db) =>
        {
            var appointments = await db.Appointments
                .Include(a => a.Patient)
                .Where(a => a.PatientId == patientId)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            return Results.Ok(appointments);
        })
        .WithName("GetAppointmentsByPatient");

        // GET /api/appointments/date/{date}
        group.MapGet("/date/{date:datetime}", async (DateTime date, StomadiagnosisDbContext db) =>
        {
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1);

            var appointments = await db.Appointments
                .Include(a => a.Patient)
                .Where(a => a.AppointmentDate >= startOfDay && a.AppointmentDate < endOfDay)
                .OrderBy(a => a.AppointmentDate)
                .ToListAsync();

            return Results.Ok(appointments);
        })
        .WithName("GetAppointmentsByDate");

        // POST /api/appointments
        group.MapPost("/", async (Appointment appointment, StomadiagnosisDbContext db) =>
        {
            // Check if patient exists
            var patientExists = await db.Patients.AnyAsync(p => p.Id == appointment.PatientId);
            if (!patientExists)
                return Results.BadRequest("Patient not found");

            appointment.CreatedAt = DateTime.UtcNow;
            appointment.UpdatedAt = DateTime.UtcNow;
            
            db.Appointments.Add(appointment);
            await db.SaveChangesAsync();

            return Results.Created($"/api/appointments/{appointment.Id}", appointment);
        })
        .WithName("CreateAppointment");

        // PUT /api/appointments/{id}
        group.MapPut("/{id:int}", async (int id, Appointment updatedAppointment, StomadiagnosisDbContext db) =>
        {
            var appointment = await db.Appointments.FindAsync(id);
            if (appointment is null)
                return Results.NotFound();

            appointment.AppointmentDate = updatedAppointment.AppointmentDate;
            appointment.Duration = updatedAppointment.Duration;
            appointment.Status = updatedAppointment.Status;
            appointment.AppointmentType = updatedAppointment.AppointmentType;
            appointment.Notes = updatedAppointment.Notes;
            appointment.Reason = updatedAppointment.Reason;
            appointment.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return Results.Ok(appointment);
        })
        .WithName("UpdateAppointment");

        // DELETE /api/appointments/{id}
        group.MapDelete("/{id:int}", async (int id, StomadiagnosisDbContext db) =>
        {
            var appointment = await db.Appointments.FindAsync(id);
            if (appointment is null)
                return Results.NotFound();

            db.Appointments.Remove(appointment);
            await db.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteAppointment");

        // PATCH /api/appointments/{id}/status
        group.MapPatch("/{id:int}/status", async (int id, string status, StomadiagnosisDbContext db) =>
        {
            var appointment = await db.Appointments.FindAsync(id);
            if (appointment is null)
                return Results.NotFound();

            appointment.Status = status;
            appointment.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return Results.Ok(appointment);
        })
        .WithName("UpdateAppointmentStatus");
    }
}