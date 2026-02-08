using CueFinderBookingBE.Models;
using Microsoft.EntityFrameworkCore;

namespace CueFinderBookingBE.Data;

public class BookingDbContext : DbContext
{
    public BookingDbContext(DbContextOptions<BookingDbContext> options) : base(options) { }

    public DbSet<BilliardClubRecord> BilliardClubRecords { get; set; } = null!;
    public DbSet<BilliardClubLocation> BilliardClubLocations { get; set; } = null!;
    public DbSet<BilliardClubCoOwner> BilliardClubCoOwners { get; set; } = null!;
    public DbSet<BilliardClubTable> BilliardClubTables { get; set; } = null!;
    public DbSet<BilliardClubBooking> BilliardClubBookings { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BilliardClubRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OwnerName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.OwnerEmail).HasMaxLength(200);
            entity.Property(e => e.OwnerPhone).HasMaxLength(50);
            entity.Property(e => e.Website).HasMaxLength(500);
            entity.Property(e => e.SocialLink).HasMaxLength(500);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.HasIndex(e => e.OwnerUserId).IsUnique();
            entity.HasMany(e => e.Locations).WithOne(l => l.Record).HasForeignKey(l => l.RecordId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.CoOwners).WithOne(c => c.Record).HasForeignKey(c => c.RecordId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BilliardClubLocation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Address).HasMaxLength(300);
            entity.Property(e => e.City).HasMaxLength(120);
            entity.Property(e => e.Region).HasMaxLength(120);
            entity.Property(e => e.Country).HasMaxLength(120);
            entity.Property(e => e.OpeningHours).HasMaxLength(300);
            entity.Property(e => e.SpecialNotes).HasMaxLength(1000);
            entity.Property(e => e.Latitude).HasMaxLength(50);
            entity.Property(e => e.Longitude).HasMaxLength(50);
            entity.HasMany(e => e.Tables).WithOne(t => t.Location).HasForeignKey(t => t.LocationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BilliardClubTable>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(120);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.HasIndex(e => new { e.LocationId, e.Name }).IsUnique(false);
        });

        modelBuilder.Entity<BilliardClubBooking>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CustomerName).HasMaxLength(200);
            entity.Property(e => e.CustomerEmail).HasMaxLength(200);
            entity.Property(e => e.CustomerPhone).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.HasIndex(e => e.CreatedByUserId);
            entity.HasIndex(e => e.RecordId);
            entity.HasIndex(e => e.LocationId);
            entity.HasIndex(e => e.TableId);
            entity.HasIndex(e => e.StartTime);
            entity.HasOne(e => e.Record)
                .WithMany(r => r.Bookings)
                .HasForeignKey(e => e.RecordId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Location)
                .WithMany()
                .HasForeignKey(e => e.LocationId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Table)
                .WithMany(t => t.Bookings)
                .HasForeignKey(e => e.TableId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BilliardClubCoOwner>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.CoOwnerUsername).HasMaxLength(120);
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.HasIndex(e => new { e.RecordId, e.Email }).IsUnique();
        });
    }
}
