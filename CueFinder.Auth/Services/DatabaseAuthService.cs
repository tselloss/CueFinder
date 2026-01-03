using CueFinder.Auth.Interfaces;
using CueFinder.Auth.Models;
using CueFinder.Database.Services;
using CueFinder.Database.Models;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace CueFinder.Auth.Services
{
    /// <summary>
    /// Enhanced authentication service with database integration
    /// Handles user registration, login, and profile management
    /// </summary>
    public class DatabaseAuthService : IAuthService
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly ILogger<DatabaseAuthService> _logger;

        public DatabaseAuthService(
            IUserService userService,
            ITokenService tokenService,
            ILogger<DatabaseAuthService> logger)
        {
            _userService = userService;
            _tokenService = tokenService;
            _logger = logger;
        }

        /// <summary>
        /// Authenticate user with username/email and password
        /// </summary>
        public async Task<AuthResponse> LoginAsync(string username, string password)
        {
            try
            {
                _logger.LogInformation("Login attempt for user: {Username}", username);

                // Find user by username or email
                User? user = await _userService.GetByUsernameAsync(username);
                
                if (user == null)
                {
                    user = await _userService.GetByEmailAsync(username);
                }

                // Validate user exists and password is correct
                if (user == null)
                {
                    _logger.LogWarning("Login failed: User not found - {Username}", username);
                    throw new UnauthorizedAccessException("Invalid username or password");
                }

                // Verify password
                if (!VerifyPassword(password, user.PasswordHash))
                {
                    _logger.LogWarning("Login failed: Invalid password for user {UserId}", user.Id);
                    throw new UnauthorizedAccessException("Invalid username or password");
                }

                // Check if account is active
                if (!user.IsActive)
                {
                    _logger.LogWarning("Login failed: Account inactive for user {UserId}", user.Id);
                    throw new UnauthorizedAccessException("Account is disabled");
                }

                // Update last login timestamp
                user.LastLoginAt = DateTime.UtcNow;
                await _userService.UpdateUserAsync(user);

                // Generate token
                var token = _tokenService.GenerateToken(user.Id, user.Username, user.Role);
                var expiresIn = _tokenService.GetTokenExpirationSeconds();

                _logger.LogInformation("User {UserId} logged in successfully", user.Id);

                return new AuthResponse
                {
                    AccessToken = token,
                    UserId = user.Id,
                    Username = user.Username,
                    Name = user.Name,
                    Email = user.Email,
                    Phone = user.Phone,
                    Role = user.Role,
                    ExpiresIn = expiresIn
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                throw;
            }
        }

        /// <summary>
        /// Register a new user account
        /// </summary>
        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            try
            {
                _logger.LogInformation("Registration attempt for username: {Username}", request.Username);

                // Validate input
                if (string.IsNullOrWhiteSpace(request.Username) ||
                    string.IsNullOrWhiteSpace(request.Password) ||
                    string.IsNullOrWhiteSpace(request.Name))
                {
                    throw new ArgumentException("Username, password, and name are required");
                }

                if (request.Password.Length < 6)
                {
                    throw new ArgumentException("Password must be at least 6 characters long");
                }

                // Check if username already exists
                var userExists = await _userService.UserExistsAsync(request.Username);
                if (userExists)
                {
                    _logger.LogWarning("Registration failed: Username already exists - {Username}", request.Username);
                    throw new InvalidOperationException("Username already exists");
                }

                // Check if email already exists
                if (!string.IsNullOrWhiteSpace(request.Email))
                {
                    var emailExists = await _userService.EmailExistsAsync(request.Email);
                    if (emailExists)
                    {
                        _logger.LogWarning("Registration failed: Email already exists - {Email}", request.Email);
                        throw new InvalidOperationException("Email already exists");
                    }
                }

                // Hash password
                var passwordHash = HashPassword(request.Password);

                // Create new user
                var newUser = new User
                {
                    Username = request.Username,
                    PasswordHash = passwordHash,
                    Name = request.Name,
                    Email = request.Email ?? string.Empty,
                    Phone = request.Phone ?? string.Empty,
                    Role = "user",
                    IsActive = true,
                    IsEmailVerified = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Save to database
                var createdUser = await _userService.CreateUserAsync(newUser);

                _logger.LogInformation("User registered successfully - UserId: {UserId}, Username: {Username}", 
                    createdUser.Id, createdUser.Username);

                // Generate token for newly registered user
                var token = _tokenService.GenerateToken(createdUser.Id, createdUser.Username, createdUser.Role);
                var expiresIn = _tokenService.GetTokenExpirationSeconds();

                return new AuthResponse
                {
                    AccessToken = token,
                    UserId = createdUser.Id,
                    Username = createdUser.Username,
                    Name = createdUser.Name,
                    Email = createdUser.Email,
                    Phone = createdUser.Phone,
                    Role = createdUser.Role,
                    ExpiresIn = expiresIn
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration");
                throw;
            }
        }

        /// <summary>
        /// Get user profile by ID
        /// </summary>
        public async Task<UserProfile?> GetUserProfileAsync(int userId)
        {
            try
            {
                _logger.LogInformation("Retrieving user profile for UserId: {UserId}", userId);

                var user = await _userService.GetUserWithDetailsAsync(userId);
                
                if (user == null)
                {
                    _logger.LogWarning("User profile not found - UserId: {UserId}", userId);
                    return null;
                }

                return new UserProfile
                {
                    Id = user.Id,
                    Username = user.Username,
                    Name = user.Name,
                    Email = user.Email,
                    Phone = user.Phone,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user profile");
                throw;
            }
        }

        /// <summary>
        /// Update user profile
        /// </summary>
        public async Task<UserProfile?> UpdateUserProfileAsync(int userId, string name, string email, string phone)
        {
            try
            {
                _logger.LogInformation("Updating user profile - UserId: {UserId}", userId);

                var user = await _userService.GetUserWithDetailsAsync(userId);
                
                if (user == null)
                {
                    _logger.LogWarning("User not found for profile update - UserId: {UserId}", userId);
                    return null;
                }

                // Check if email is being changed and already exists
                if (!string.IsNullOrWhiteSpace(email) &&
                    email != user.Email &&
                    await _userService.EmailExistsAsync(email))
                {
                    _logger.LogWarning("Profile update failed: Email already exists - {Email}", email);
                    throw new InvalidOperationException("Email already exists");
                }

                // Update user fields
                if (!string.IsNullOrWhiteSpace(name))
                {
                    user.Name = name;
                }

                if (!string.IsNullOrWhiteSpace(email))
                {
                    user.Email = email;
                }

                if (!string.IsNullOrWhiteSpace(phone))
                {
                    user.Phone = phone;
                }

                user.UpdatedAt = DateTime.UtcNow;

                // Save to database
                var updatedUser = await _userService.UpdateUserAsync(user);

                _logger.LogInformation("User profile updated successfully - UserId: {UserId}", userId);

                return new UserProfile
                {
                    Id = updatedUser.Id,
                    Username = updatedUser.Username,
                    Name = updatedUser.Name,
                    Email = updatedUser.Email,
                    Phone = updatedUser.Phone,
                    Role = updatedUser.Role,
                    CreatedAt = updatedUser.CreatedAt,
                    UpdatedAt = updatedUser.UpdatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                throw;
            }
        }

        /// <summary>
        /// Verify if a user exists by ID
        /// </summary>
        public async Task<bool> UserExistsAsync(int userId)
        {
            try
            {
                var user = await _userService.GetUserWithDetailsAsync(userId);
                return user != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user exists");
                throw;
            }
        }

        /// <summary>
        /// Hash password using PBKDF2
        /// </summary>
        private string HashPassword(string password)
        {
            try
            {
                using (var sha256 = SHA256.Create())
                {
                    var hashedBuffer = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                    return Convert.ToBase64String(hashedBuffer);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error hashing password");
                throw;
            }
        }

        /// <summary>
        /// Verify password against hash
        /// </summary>
        private bool VerifyPassword(string password, string hash)
        {
            try
            {
                using (var sha256 = SHA256.Create())
                {
                    var hashOfInput = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                    var hashString = Convert.ToBase64String(hashOfInput);
                    return hashString == hash;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying password");
                return false;
            }
        }
    }
}
