using Microsoft.EntityFrameworkCore;
using CueFinder.Database.Models;

namespace CueFinder.Database.Context
{
    /// <summary>
    /// Entity Framework Core Database Context for CueFinder application
    /// </summary>
    public class CueFinderDbContext : DbContext
    {
        public CueFinderDbContext(DbContextOptions<CueFinderDbContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
            // Configure query splitting behavior to avoid slow queries with multiple includes
            optionsBuilder.ConfigureWarnings(w => 
                w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.MultipleCollectionIncludeWarning));
        }

        // DbSets for all entities
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Cue> Cues { get; set; } = null!;
        public DbSet<CueImage> CueImages { get; set; } = null!;
        public DbSet<CueCase> CueCases { get; set; } = null!;
        public DbSet<CueCaseImage> CueCaseImages { get; set; } = null!;
        public DbSet<BilliardTable> BilliardTables { get; set; } = null!;
        public DbSet<BilliardTableImage> BilliardTableImages { get; set; } = null!;
        public DbSet<Rating> Ratings { get; set; } = null!;
        public DbSet<Message> Messages { get; set; } = null!;
        public DbSet<SavedCue> SavedCues { get; set; } = null!;
        public DbSet<SavedBilliardTable> SavedBilliardTables { get; set; } = null!;
        public DbSet<Transaction> Transactions { get; set; } = null!;
        public DbSet<PhoneVerificationToken> PhoneVerificationTokens { get; set; } = null!;
        public DbSet<FlaggedImage> FlaggedImages { get; set; } = null!;
        public DbSet<ModerationQueue> ModerationQueues { get; set; } = null!;
        public DbSet<UserReport> UserReports { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User entity configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasIndex(e => e.Username)
                    .IsUnique()
                    .HasDatabaseName("IX_User_Username");

                entity.HasIndex(e => e.Email)
                    .IsUnique()
                    .HasDatabaseName("IX_User_Email");

                entity.Property(e => e.Username)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.PasswordHash)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Phone)
                    .HasMaxLength(20);

                // Optional general location (city/area) for display
                entity.Property(e => e.Location)
                    .HasMaxLength(200);

                entity.Property(e => e.Role)
                    .HasMaxLength(50)
                    .HasDefaultValueSql("'user'");

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'")
                    .ValueGeneratedOnAddOrUpdate();
            });

            // Cue entity configuration
            modelBuilder.Entity<Cue>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.PostedCues)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Images)
                    .WithOne(i => i.Cue)
                    .HasForeignKey(i => i.CueId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Ratings)
                    .WithOne(r => r.Cue)
                    .HasForeignKey(r => r.CueId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.SavedByUsers)
                    .WithOne(s => s.Cue)
                    .HasForeignKey(s => s.CueId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Brand)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Description)
                    .HasMaxLength(2000);

                entity.Property(e => e.Price)
                    .HasPrecision(10, 2);

                entity.Property(e => e.CueType)
                    .HasMaxLength(50);

                entity.Property(e => e.Condition)
                    .HasMaxLength(50);

                entity.Property(e => e.Location)
                    .HasMaxLength(200);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasIndex(e => e.UserId)
                    .HasDatabaseName("IX_Cue_UserId");

                entity.HasIndex(e => e.IsSold)
                    .HasDatabaseName("IX_Cue_IsSold");

                entity.HasIndex(e => new { e.Brand, e.CueType })
                    .HasDatabaseName("IX_Cue_Brand_Type");
            });

            // CueImage entity configuration
            modelBuilder.Entity<CueImage>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.ImageUrl)
                    .IsRequired();

                entity.Property(e => e.AltText)
                    .HasMaxLength(200);

                entity.Property(e => e.UploadedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                // Base64 image data for production storage
                entity.Property(e => e.ImageData)
                    .HasColumnType("text");

                entity.Property(e => e.ContentType)
                    .HasMaxLength(100);

                entity.HasIndex(e => e.CueId)
                    .HasDatabaseName("IX_CueImage_CueId");
            });

            // Rating entity configuration
            modelBuilder.Entity<Rating>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Cue)
                    .WithMany(c => c.Ratings)
                    .HasForeignKey(e => e.CueId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.RatedByUser)
                    .WithMany(u => u.RatingsGiven)
                    .HasForeignKey(e => e.RatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.SellerUser)
                    .WithMany(u => u.RatingsReceived)
                    .HasForeignKey(e => e.SellerUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.RatingValue)
                    .HasDefaultValue(0);

                entity.Property(e => e.Category)
                    .HasMaxLength(50);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasIndex(e => new { e.CueId, e.RatedByUserId })
                    .IsUnique()
                    .HasDatabaseName("IX_Rating_Unique_User_Cue");
            });

            // Message entity configuration
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Sender)
                    .WithMany(u => u.SentMessages)
                    .HasForeignKey(e => e.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Recipient)
                    .WithMany(u => u.ReceivedMessages)
                    .HasForeignKey(e => e.RecipientId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Cue)
                    .WithMany()
                    .HasForeignKey(e => e.CueId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(e => e.Subject)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Content)
                    .IsRequired()
                    .HasMaxLength(4000);

                entity.Property(e => e.MessageType)
                    .HasMaxLength(50);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasIndex(e => new { e.SenderId, e.RecipientId })
                    .HasDatabaseName("IX_Message_Sender_Recipient");

                entity.HasIndex(e => e.IsRead)
                    .HasDatabaseName("IX_Message_IsRead");
            });

            // SavedCue entity configuration
            modelBuilder.Entity<SavedCue>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.SavedCues)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Cue)
                    .WithMany(c => c.SavedByUsers)
                    .HasForeignKey(e => e.CueId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.SavedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasIndex(e => new { e.UserId, e.CueId })
                    .IsUnique()
                    .HasDatabaseName("IX_SavedCue_Unique_User_Cue");
            });

            // Transaction entity configuration
            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Cue)
                    .WithMany()
                    .HasForeignKey(e => e.CueId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Seller)
                    .WithMany()
                    .HasForeignKey(e => e.SellerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Buyer)
                    .WithMany()
                    .HasForeignKey(e => e.BuyerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.SalePrice)
                    .HasPrecision(10, 2);

                entity.Property(e => e.ShippingCost)
                    .HasPrecision(10, 2);

                entity.Property(e => e.Status)
                    .HasMaxLength(50);

                entity.Property(e => e.ShippingMethod)
                    .HasMaxLength(100);

                entity.Property(e => e.PaymentMethod)
                    .HasMaxLength(100);

                entity.Property(e => e.TransactionNumber)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasIndex(e => e.TransactionNumber)
                    .IsUnique()
                    .HasDatabaseName("IX_Transaction_Number");

                entity.HasIndex(e => e.Status)
                    .HasDatabaseName("IX_Transaction_Status");
            });

            // PhoneVerificationToken entity configuration
            modelBuilder.Entity<PhoneVerificationToken>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.PhoneVerificationTokens)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.PhoneNumber)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.Token)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.MagicLinkToken)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.VerificationCode)
                    .IsRequired()
                    .HasMaxLength(6);

                entity.Property(e => e.VerificationMethod)
                    .HasMaxLength(50)
                    .HasDefaultValue("SMS");

                entity.Property(e => e.IpAddress)
                    .HasMaxLength(45);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasIndex(e => e.Token)
                    .IsUnique()
                    .HasDatabaseName("IX_PhoneVerification_Token");

                entity.HasIndex(e => e.MagicLinkToken)
                    .IsUnique()
                    .HasDatabaseName("IX_PhoneVerification_MagicLinkToken");

                entity.HasIndex(e => new { e.UserId, e.IsUsed, e.ExpiresAt })
                    .HasDatabaseName("IX_PhoneVerification_User_Status");
            });

            // CueCase entity configuration
            modelBuilder.Entity<CueCase>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Brand)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Description)
                    .HasMaxLength(2000);

                entity.Property(e => e.Price)
                    .HasPrecision(10, 2);

                entity.Property(e => e.CaseCapacity)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.CaseOpening)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.CaseType)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Color)
                    .HasMaxLength(100);

                entity.Property(e => e.CaseMaterial)
                    .HasMaxLength(200);

                entity.Property(e => e.OuterDimensions)
                    .HasMaxLength(200);

                entity.Property(e => e.PocketSpace)
                    .HasMaxLength(50);

                entity.Property(e => e.HandleExtensionSpace)
                    .HasMaxLength(200);

                entity.Property(e => e.CaseWeight)
                    .HasMaxLength(100);

                entity.Property(e => e.Condition)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Location)
                    .HasMaxLength(200);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.UserId)
                    .HasDatabaseName("IX_CueCase_UserId");

                entity.HasIndex(e => e.Price)
                    .HasDatabaseName("IX_CueCase_Price");

                entity.HasIndex(e => e.CreatedAt)
                    .HasDatabaseName("IX_CueCase_CreatedAt");

                entity.HasIndex(e => e.IsSold)
                    .HasDatabaseName("IX_CueCase_IsSold");
            });

            // CueCaseImage entity configuration
            modelBuilder.Entity<CueCaseImage>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.ImageUrl)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.UploadedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasOne(e => e.CueCase)
                    .WithMany(c => c.Images)
                    .HasForeignKey(e => e.CueCaseId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.CueCaseId)
                    .HasDatabaseName("IX_CueCaseImage_CueCaseId");

                entity.HasIndex(e => new { e.CueCaseId, e.IsPrimary })
                    .HasDatabaseName("IX_CueCaseImage_Primary");
            });

            // FlaggedImage entity configuration
            modelBuilder.Entity<FlaggedImage>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.ImageHash)
                    .IsRequired()
                    .HasMaxLength(256);

                entity.Property(e => e.FileName)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.StoragePath)
                    .IsRequired()
                    .HasMaxLength(1000);

                entity.Property(e => e.FlagReason)
                    .HasMaxLength(50)
                    .HasDefaultValue("other");

                entity.Property(e => e.Status)
                    .HasMaxLength(20)
                    .HasDefaultValue("pending");

                entity.Property(e => e.FlaggedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.AdminUser)
                    .WithMany()
                    .HasForeignKey(e => e.AdminUserId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => e.ImageHash)
                    .HasDatabaseName("IX_FlaggedImage_Hash");

                entity.HasIndex(e => e.Status)
                    .HasDatabaseName("IX_FlaggedImage_Status");

                entity.HasIndex(e => e.UserId)
                    .HasDatabaseName("IX_FlaggedImage_UserId");

                entity.HasIndex(e => new { e.CueId, e.Status })
                    .HasDatabaseName("IX_FlaggedImage_CueStatus");

                entity.HasIndex(e => new { e.CueCaseId, e.Status })
                    .HasDatabaseName("IX_FlaggedImage_CasesStatus");
            });

            // ModerationQueue entity configuration
            modelBuilder.Entity<ModerationQueue>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Priority)
                    .HasDefaultValue(2);

                entity.Property(e => e.AddedToQueueAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasOne(e => e.FlaggedImage)
                    .WithMany()
                    .HasForeignKey(e => e.FlaggedImageId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.ReviewingAdmin)
                    .WithMany()
                    .HasForeignKey(e => e.ReviewingAdminId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => e.Priority)
                    .HasDatabaseName("IX_ModerationQueue_Priority");

                entity.HasIndex(e => e.IsBeingReviewed)
                    .HasDatabaseName("IX_ModerationQueue_BeingReviewed");
            });

            // UserReport entity configuration
            modelBuilder.Entity<UserReport>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.ReportReason)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.ReportedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasOne(e => e.ReportingUser)
                    .WithMany()
                    .HasForeignKey(e => e.ReportingUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.FlaggedImage)
                    .WithMany()
                    .HasForeignKey(e => e.FlaggedImageId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.ReportingUserId)
                    .HasDatabaseName("IX_UserReport_ReportingUserId");

                entity.HasIndex(e => e.FlaggedImageId)
                    .HasDatabaseName("IX_UserReport_FlaggedImageId");
            });

            // BilliardTable entity configuration
            modelBuilder.Entity<BilliardTable>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.IsSold)
                    .HasDefaultValue(false);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.Property(e => e.ViewCount)
                    .HasDefaultValue(0);

                entity.Property(e => e.IsFlagged)
                    .HasDefaultValue(false);

                entity.Property(e => e.ModerationStatus)
                    .HasDefaultValue("approved");

                entity.HasIndex(e => e.UserId)
                    .HasDatabaseName("IX_BilliardTable_UserId");

                entity.HasIndex(e => e.IsSold)
                    .HasDatabaseName("IX_BilliardTable_IsSold");

                entity.HasIndex(e => e.IsFlagged)
                    .HasDatabaseName("IX_BilliardTable_IsFlagged");

                entity.HasIndex(e => e.CreatedAt)
                    .HasDatabaseName("IX_BilliardTable_CreatedAt");
            });

            // BilliardTableImage entity configuration
            modelBuilder.Entity<BilliardTableImage>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.BilliardTable)
                    .WithMany(t => t.Images)
                    .HasForeignKey(e => e.BilliardTableId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.IsPrimary)
                    .HasDefaultValue(false);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasIndex(e => e.BilliardTableId)
                    .HasDatabaseName("IX_BilliardTableImage_BilliardTableId");

                entity.HasIndex(e => new { e.BilliardTableId, e.IsPrimary })
                    .HasDatabaseName("IX_BilliardTableImage_Primary");
            });

            // SavedBilliardTable entity configuration
            modelBuilder.Entity<SavedBilliardTable>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.BilliardTable)
                    .WithMany(t => t.SavedByUsers)
                    .HasForeignKey(e => e.BilliardTableId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.SavedAt)
                    .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

                entity.HasIndex(e => new { e.UserId, e.BilliardTableId })
                    .IsUnique()
                    .HasDatabaseName("IX_SavedBilliardTable_Unique_User_Table");
            });
        }
    }
}
