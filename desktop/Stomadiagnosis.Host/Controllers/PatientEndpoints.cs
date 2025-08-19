using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Stomadiagnosis.Host.Data;
using Stomadiagnosis.Host.Models;

namespace Stomadiagnosis.Host.Controllers;

public static class PatientEndpoints
{
    public static void MapPatientEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/patients").WithTags("Patients");

        // GET /api/patients
        group.MapGet("/", async (StomadiagnosisDbContext db) =>
        {
            return await db.Patients
                .Include(p => p.Appointments)
                .Include(p => p.Treatments)
                .Include(p => p.XRayImages)
                .Include(p => p.Diagnoses)
                .ToListAsync();
        })
        .WithName("GetPatients");

        // GET /api/patients/{id}
        group.MapGet("/{id:int}", async (int id, StomadiagnosisDbContext db) =>
        {
            var patient = await db.Patients
                .Include(p => p.Appointments)
                .Include(p => p.Treatments)
                .Include(p => p.XRayImages)
                .Include(p => p.Diagnoses)
                .FirstOrDefaultAsync(p => p.Id == id);

            return patient is not null ? Results.Ok(patient) : Results.NotFound();
        })
        .WithName("GetPatientById");

        // POST /api/patients
        group.MapPost("/", async (Patient patient, StomadiagnosisDbContext db) =>
        {
            patient.CreatedAt = DateTime.UtcNow;
            patient.UpdatedAt = DateTime.UtcNow;
            
            db.Patients.Add(patient);
            await db.SaveChangesAsync();

            return Results.Created($"/api/patients/{patient.Id}", patient);
        })
        .WithName("CreatePatient");

        // PUT /api/patients/{id}
        group.MapPut("/{id:int}", async (int id, Patient updatedPatient, StomadiagnosisDbContext db) =>
        {
            var patient = await db.Patients.FindAsync(id);
            if (patient is null)
                return Results.NotFound();

            patient.FirstName = updatedPatient.FirstName;
            patient.LastName = updatedPatient.LastName;
            patient.Phone = updatedPatient.Phone;
            patient.Email = updatedPatient.Email;
            patient.DateOfBirth = updatedPatient.DateOfBirth;
            patient.Gender = updatedPatient.Gender;
            patient.Address = updatedPatient.Address;
            patient.MedicalHistory = updatedPatient.MedicalHistory;
            patient.Allergies = updatedPatient.Allergies;
            patient.CurrentMedications = updatedPatient.CurrentMedications;
            patient.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return Results.Ok(patient);
        })
        .WithName("UpdatePatient");

        // DELETE /api/patients/{id}
        group.MapDelete("/{id:int}", async (int id, StomadiagnosisDbContext db) =>
        {
            var patient = await db.Patients.FindAsync(id);
            if (patient is null)
                return Results.NotFound();

            db.Patients.Remove(patient);
            await db.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeletePatient");

        // GET /api/patients/search?query={query}
        group.MapGet("/search", async (string query, StomadiagnosisDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(query))
                return Results.BadRequest("Query parameter is required");

            var patients = await db.Patients
                .Where(p => p.FirstName.Contains(query) || 
                           p.LastName.Contains(query) || 
                           (p.Email != null && p.Email.Contains(query)) || 
                           (p.Phone != null && p.Phone.Contains(query)))
                .ToListAsync();

            return Results.Ok(patients);
        })
        .WithName("SearchPatients");
    }
}