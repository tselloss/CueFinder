using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Database.Repositories
{
    /// <summary>
    /// Repository interface for User operations
    /// </summary>
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByEmailAsync(string email);
        Task<List<User>> GetUsersByRoleAsync(string role);
        Task<bool> UserExistsAsync(string username);
        Task<bool> EmailExistsAsync(string email);
    }

    /// <summary>
    /// Repository implementation for User operations
    /// </summary>
    public class UserRepository : Repository<User>, IUserRepository
    {
        private readonly CueFinderDbContext _context;
        private readonly ILogger<UserRepository> _logger;

        public UserRepository(CueFinderDbContext context, ILogger<UserRepository> logger)
            : base(context, logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get user by username
        /// </summary>
        public async Task<User?> GetByUsernameAsync(string username)
        {
            try
            {
                return await _context.Users
                    .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user by username {Username}", username);
                throw;
            }
        }

        /// <summary>
        /// Get user by email
        /// </summary>
        public async Task<User?> GetByEmailAsync(string email)
        {
            try
            {
                return await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user by email {Email}", email);
                throw;
            }
        }

        /// <summary>
        /// Get users by role
        /// </summary>
        public async Task<List<User>> GetUsersByRoleAsync(string role)
        {
            try
            {
                return await _context.Users
                    .Where(u => u.Role.ToLower() == role.ToLower())
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users by role {Role}", role);
                throw;
            }
        }

        /// <summary>
        /// Check if username exists
        /// </summary>
        public async Task<bool> UserExistsAsync(string username)
        {
            try
            {
                return await _context.Users
                    .AnyAsync(u => u.Username.ToLower() == username.ToLower());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user exists {Username}", username);
                throw;
            }
        }

        /// <summary>
        /// Check if email exists
        /// </summary>
        public async Task<bool> EmailExistsAsync(string email)
        {
            try
            {
                return await _context.Users
                    .AnyAsync(u => u.Email.ToLower() == email.ToLower());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if email exists {Email}", email);
                throw;
            }
        }
    }
}
