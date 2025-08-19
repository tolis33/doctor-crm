using Microsoft.EntityFrameworkCore;
using Stomadiagnosis.Host.Models;

namespace Stomadiagnosis.Host.Data;

public class StomadiagnosisDbContext : DbContext
{
    public StomadiagnosisDbContext(DbContextOptions<StomadiagnosisDbContext> options) : base(options)
    {
    }

    public DbSet<Patient> Patients { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Treatment> Treatments { get; set; }
    public DbSet<XRayImage> XRayImages { get; set; }
    public DbSet<Diagnosis> Diagnoses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Patient entity
        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
        });

        // Configure Appointment entity
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasOne(d => d.Patient)
                  .WithMany(p => p.Appointments)
                  .HasForeignKey(d => d.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
        });

        // Configure Treatment entity
        modelBuilder.Entity<Treatment>(entity =>
        {
            entity.HasOne(d => d.Patient)
                  .WithMany(p => p.Treatments)
                  .HasForeignKey(d => d.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
        });

        // Configure XRayImage entity
        modelBuilder.Entity<XRayImage>(entity =>
        {
            entity.HasOne(d => d.Patient)
                  .WithMany(p => p.XRayImages)
                  .HasForeignKey(d => d.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
        });

        // Configure Diagnosis entity
        modelBuilder.Entity<Diagnosis>(entity =>
        {
            entity.HasOne(d => d.Patient)
                  .WithMany(p => p.Diagnoses)
                  .HasForeignKey(d => d.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.XRayImage)
                  .WithMany(x => x.Diagnoses)
                  .HasForeignKey(d => d.XRayImageId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
        });

        // Seed data (optional)
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Add some sample data if needed
        modelBuilder.Entity<Patient>().HasData(
            new Patient
            {
                Id = 1,
                FirstName = "Γιάννης",
                LastName = "Παπαδόπουλος",
                Email = "giannis@example.com",
                Phone = "6912345678",
                DateOfBirth = new DateTime(1980, 5, 15),
                Gender = "Άνδρας",
                Address = "Αθήνα, Ελλάδα",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );
    }
}