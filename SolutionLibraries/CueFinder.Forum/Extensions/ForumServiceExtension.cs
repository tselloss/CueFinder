using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CueFinder.Forum.Data;
using CueFinder.Forum.Repositories;
using CueFinder.Forum.Services;
using MassTransit;
using Npgsql.EntityFrameworkCore.PostgreSQL;

namespace CueFinder.Forum.Extensions
{
    /// <summary>
    /// Extension methods for registering forum services
    /// </summary>
    public static class ForumServiceExtension
    {
        /// <summary>
        /// Add forum services to dependency injection container
        /// </summary>
        public static IServiceCollection AddForumServices(
            this IServiceCollection services,
            string connectionString)
        {
            // Register DbContext
            services.AddDbContext<ForumDbContext>(options =>
                options.UseNpgsql(connectionString,
                    npgsqlOptions => {
                        npgsqlOptions.CommandTimeout(30);
                        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory_Forum");
                    })
            );

            // Register generic repository
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

            // Register specialized repositories
            services.AddScoped<IDiscussionRepository, DiscussionRepository>();
            services.AddScoped<IPostRepository, PostRepository>();
            services.AddScoped<INotificationRepository, NotificationRepository>();
            services.AddScoped<ILikeRepository, LikeRepository>();
            services.AddScoped<IMentionRepository, MentionRepository>();

            // Register domain services
            services.AddScoped<IDiscussionService, DiscussionService>();
            services.AddScoped<IPostService, PostService>();
            services.AddScoped<IForumNotificationService, ForumNotificationService>();

            // Register MassTransit for event publishing (in-memory for now)
            services.AddMassTransit(x =>
            {
                x.UsingInMemory((context, cfg) =>
                {
                    cfg.ConfigureEndpoints(context);
                });
            });

            return services;
        }

        /// <summary>
        /// Initialize forum database (create or migrate)
        /// </summary>
        public static async Task InitializeForumDatabaseAsync(this IServiceProvider serviceProvider)
        {
            using (var scope = serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ForumDbContext>();
                
                try
                {
                    // Apply pending migrations
                    await dbContext.Database.MigrateAsync();
                    Console.WriteLine("✅ Forum database migrations applied successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Forum database initialization failed: {ex.Message}");
                    throw;
                }
            }
        }
    }
}
