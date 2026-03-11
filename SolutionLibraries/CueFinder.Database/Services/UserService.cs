using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Database.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Database.Services
{
    /// <summary>
    /// Service interface for User operations
    /// </summary>
    public interface IUserService
    {
    Task<List<User>> GetAllUsersAsync();
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
        /// Get all users
        /// </summary>
        public async Task<List<User>> GetAllUsersAsync()
        {
            try
            {
                return await _userRepository.GetAllAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all users");
                throw;
            }
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
        /// Delete user and all related data (cascade via code to avoid FK violations)
        /// </summary>
        public async Task<bool> DeleteUserAsync(int userId)
        {
            try
            {
                // Remove raffle entries the user participated in
                var raffleEntries = await _context.RaffleEntries.Where(e => e.UserId == userId).ToListAsync();
                _context.RaffleEntries.RemoveRange(raffleEntries);

                // Remove raffles created by the user (and their entries first)
                var userRaffleIds = await _context.Raffles.Where(r => r.OrganizerId == userId).Select(r => r.Id).ToListAsync();
                if (userRaffleIds.Any())
                {
                    var ownRaffleEntries = await _context.RaffleEntries.Where(e => userRaffleIds.Contains(e.RaffleId)).ToListAsync();
                    _context.RaffleEntries.RemoveRange(ownRaffleEntries);
                    var raffles = await _context.Raffles.Where(r => userRaffleIds.Contains(r.Id)).ToListAsync();
                    _context.Raffles.RemoveRange(raffles);
                }

                // Remove messages
                var messages = await _context.Messages.Where(m => m.SenderId == userId || m.RecipientId == userId).ToListAsync();
                _context.Messages.RemoveRange(messages);

                // Remove ratings given/received
                var ratings = await _context.Ratings.Where(r => r.RatedByUserId == userId || r.SellerUserId == userId).ToListAsync();
                _context.Ratings.RemoveRange(ratings);

                // Remove saved cues and tables
                var savedCues = await _context.SavedCues.Where(s => s.UserId == userId).ToListAsync();
                _context.SavedCues.RemoveRange(savedCues);
                var savedTables = await _context.SavedBilliardTables.Where(s => s.UserId == userId).ToListAsync();
                _context.SavedBilliardTables.RemoveRange(savedTables);

                // Remove transactions (user may be buyer or seller)
                var transactions = await _context.Transactions.Where(t => t.SellerId == userId || t.BuyerId == userId).ToListAsync();
                _context.Transactions.RemoveRange(transactions);

                // Remove tokens
                var phoneTokens = await _context.PhoneVerificationTokens.Where(t => t.UserId == userId).ToListAsync();
                _context.PhoneVerificationTokens.RemoveRange(phoneTokens);
                var pwTokens = await _context.PasswordResetTokens.Where(t => t.UserId == userId).ToListAsync();
                _context.PasswordResetTokens.RemoveRange(pwTokens);

                // Remove moderation queues that reference this user's flagged images, then flagged images
                var userFlaggedImageIds = await _context.FlaggedImages.Where(f => f.UserId == userId).Select(f => f.Id).ToListAsync();
                if (userFlaggedImageIds.Any())
                {
                    var modQueues = await _context.ModerationQueues.Where(m => userFlaggedImageIds.Contains(m.FlaggedImageId)).ToListAsync();
                    _context.ModerationQueues.RemoveRange(modQueues);
                }
                var flaggedImages = await _context.FlaggedImages.Where(f => f.UserId == userId).ToListAsync();
                _context.FlaggedImages.RemoveRange(flaggedImages);

                // Remove user reports filed by this user
                var userReports = await _context.UserReports.Where(r => r.ReportingUserId == userId).ToListAsync();
                _context.UserReports.RemoveRange(userReports);

                // Remove cue images then cues
                var cueIds = await _context.Cues.Where(c => c.UserId == userId).Select(c => c.Id).ToListAsync();
                if (cueIds.Any())
                {
                    var cueImages = await _context.CueImages.Where(i => cueIds.Contains(i.CueId)).ToListAsync();
                    _context.CueImages.RemoveRange(cueImages);
                    var cues = await _context.Cues.Where(c => cueIds.Contains(c.Id)).ToListAsync();
                    _context.Cues.RemoveRange(cues);
                }

                // Remove cue case images then cases
                var caseIds = await _context.CueCases.Where(c => c.UserId == userId).Select(c => c.Id).ToListAsync();
                if (caseIds.Any())
                {
                    var caseImages = await _context.CueCaseImages.Where(i => caseIds.Contains(i.CueCaseId)).ToListAsync();
                    _context.CueCaseImages.RemoveRange(caseImages);
                    var cases = await _context.CueCases.Where(c => caseIds.Contains(c.Id)).ToListAsync();
                    _context.CueCases.RemoveRange(cases);
                }

                // Remove billiard table images then tables
                var tableIds = await _context.BilliardTables.Where(t => t.UserId == userId).Select(t => t.Id).ToListAsync();
                if (tableIds.Any())
                {
                    var tableImages = await _context.BilliardTableImages.Where(i => tableIds.Contains(i.BilliardTableId)).ToListAsync();
                    _context.BilliardTableImages.RemoveRange(tableImages);
                    var tables = await _context.BilliardTables.Where(t => tableIds.Contains(t.Id)).ToListAsync();
                    _context.BilliardTables.RemoveRange(tables);
                }

                // Remove accessory images then accessories
                var accIds = await _context.Accessories.Where(a => a.UserId == userId).Select(a => a.Id).ToListAsync();
                if (accIds.Any())
                {
                    var accImages = await _context.AccessoryImages.Where(i => accIds.Contains(i.AccessoryId)).ToListAsync();
                    _context.AccessoryImages.RemoveRange(accImages);
                    var accessories = await _context.Accessories.Where(a => accIds.Contains(a.Id)).ToListAsync();
                    _context.Accessories.RemoveRange(accessories);
                }

                await _context.SaveChangesAsync();

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
