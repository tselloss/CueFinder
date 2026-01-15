using Microsoft.EntityFrameworkCore;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.Data;

/// <summary>
/// Entity Framework Core DbContext for Forum domain
/// </summary>
public class ForumDbContext : DbContext
{
    public ForumDbContext(DbContextOptions<ForumDbContext> options) : base(options) { }

    public DbSet<ForumCategory> Categories { get; set; } = null!;
    
    public DbSet<Discussion> Discussions { get; set; } = null!;
    
    public DbSet<Post> Posts { get; set; } = null!;
    
    public DbSet<ForumNotification> Notifications { get; set; } = null!;
    
    public DbSet<PostLike> PostLikes { get; set; } = null!;
    
    public DbSet<PostMention> PostMentions { get; set; } = null!;
    
    public DbSet<DiscussionView> DiscussionViews { get; set; } = null!;
    
    public DbSet<DiscussionSubscription> DiscussionSubscriptions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ForumCategory configuration
        modelBuilder.Entity<ForumCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasMany(e => e.Discussions).WithOne(d => d.Category).HasForeignKey(d => d.CategoryId);
        });

        // Discussion configuration
        modelBuilder.Entity<Discussion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Content).IsRequired();
            entity.HasIndex(e => e.CreatedByUserId);
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsPinned);
            entity.HasIndex(e => e.IsLocked);
        });

        // Post configuration
        modelBuilder.Entity<Post>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired();
            entity.HasIndex(e => e.DiscussionId);
            entity.HasIndex(e => e.CreatedByUserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.DeletedAt);
            
            // Self-referencing relationship for replies
            entity.HasOne(e => e.ReplyToPost)
                .WithMany(e => e.Replies)
                .HasForeignKey(e => e.ReplyToPostId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ForumNotification configuration
        modelBuilder.Entity<ForumNotification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Message).IsRequired();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.IsRead });
            entity.HasIndex(e => e.CreatedAt);
        });

        // PostLike configuration
        modelBuilder.Entity<PostLike>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.PostId, e.UserId }).IsUnique();
            entity.HasOne(e => e.Post).WithMany(p => p.Likes).HasForeignKey(e => e.PostId);
        });

        // PostMention configuration
        modelBuilder.Entity<PostMention>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.MentionedUserId);
            entity.HasOne(e => e.Post).WithMany(p => p.Mentions).HasForeignKey(e => e.PostId);
        });

        // DiscussionView configuration
        modelBuilder.Entity<DiscussionView>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.DiscussionId, e.UserId }).IsUnique();
            entity.HasOne(e => e.Discussion).WithMany(d => d.Views).HasForeignKey(e => e.DiscussionId);
        });

        // DiscussionSubscription configuration
        modelBuilder.Entity<DiscussionSubscription>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.DiscussionId, e.UserId }).IsUnique();
            entity.HasOne(e => e.Discussion).WithMany(d => d.Subscriptions).HasForeignKey(e => e.DiscussionId);
        });
    }
}
