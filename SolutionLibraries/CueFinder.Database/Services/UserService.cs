using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Database.Repositories;
using Microsoft.Extensions.Logging;

namespace CueFinder.Database.Services
{
    /// <summary>
    /// Service interface for User operations
    /// </summary>
    public interface IUserService
    {
        Task<User?> GetUserWithDetailsAsync(int id);
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByEmailAsync(string email);
        Task<User> CreateUserAsync(User user);
        Task<User> UpdateUserAsync(User user);
        Task<bool> DeleteUserAsync(int userId);
        Task<bool> UserExistsAsync(string username);
        Task<bool> EmailExistsAsync(string email);
    }

    /// <summary>
    /// Service implementation for User operations
    /// </summary>
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly CueFinderDbContext _context;
        private readonly ILogger<UserService> _logger;

        public UserService(
            IUserRepository userRepository,
            CueFinderDbContext context,
            ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get user with all related details
        /// </summary>
        public async Task<User?> GetUserWithDetailsAsync(int id)
        {
            try
            {
                return await _userRepository.GetByIdAsync(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user {UserId} with details", id);
                throw;
            }
        }

        /// <summary>
        /// Get user by username
        /// </summary>
        public async Task<User?> GetByUsernameAsync(string username)
        {
            try
            {
                return await _userRepository.GetByUsernameAsync(username);
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
                return await _userRepository.GetByEmailAsync(email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user by email {Email}", email);
                throw;
            }
        }

        /// <summary>
        /// Create new user
        /// </summary>
        public async Task<User> CreateUserAsync(User user)
        {
            try
            {
                // Check if username already exists
                if (await _userRepository.UserExistsAsync(user.Username))
                {
                    throw new InvalidOperationException("Username already exists");
                }

                // Check if email already exists
                if (await _userRepository.EmailExistsAsync(user.Email))
                {
                    throw new InvalidOperationException("Email already exists");
                }

                user.CreatedAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
                return await _userRepository.AddAsync(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                throw;
            }
        }

        /// <summary>
        /// Update existing user
        /// </summary>
        public async Task<User> UpdateUserAsync(User user)
        {
            try
            {
                user.UpdatedAt = DateTime.UtcNow;
                return await _userRepository.UpdateAsync(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user");
                throw;
            }
        }

        /// <summary>
        /// Delete user
        /// </summary>
        public async Task<bool> DeleteUserAsync(int userId)
        {
            try
            {
                return await _userRepository.DeleteAsync(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", userId);
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
                return await _userRepository.UserExistsAsync(username);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user exists");
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
                return await _userRepository.EmailExistsAsync(email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if email exists");
                throw;
            }
        }
    }
}
