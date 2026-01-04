using CueFinder.Auth.Interfaces;
using CueFinder.Auth.Models;

namespace CueFinder.Auth.Services
{
    /// <summary>
    /// Authentication service handling login, registration, and user profile management
    /// </summary>
    public class AuthService : IAuthService
    {
        // In-memory user store for demo purposes
        // In production, this would connect to a real database
        private static readonly List<UserData> Users = new()
        {
            new UserData
            {
                Id = 1,
                Username = "admin",
                Password = "admin123", // In production, use hashed passwords
                Name = "Administrator",
                Email = "admin@cuefinder.com",
                Phone = "555-0001",
                Role = "admin",
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            },
            new UserData
            {
                Id = 2,
                Username = "user",
                Password = "user123",
                Name = "Regular User",
                Email = "user@cuefinder.com",
                Phone = "555-0002",
                Role = "user",
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            }
        };

        private static int _nextUserId = 3;
        private readonly ITokenService _tokenService;

        public AuthService(ITokenService tokenService)
        {
            _tokenService = tokenService;
        }

        /// <summary>
        /// Authenticate user with username and password
        /// </summary>
        public async Task<AuthResponse> LoginAsync(string username, string password)
        {
            // Simulate async operation
            await Task.Delay(100);

            var user = Users.FirstOrDefault(u =>
                (u.Username == username || u.Email == username) &&
                u.Password == password);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid username or password");
            }

            var token = _tokenService.GenerateToken(user.Id, user.Username, user.Role);
            var expiresIn = _tokenService.GetTokenExpirationSeconds();

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

        /// <summary>
        /// Register a new user account
        /// </summary>
        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ArgumentException("Username, password, and name are required");
            }

            // Check if username already exists
            if (Users.Any(u => u.Username == request.Username))
            {
                throw new InvalidOperationException("Username already exists");
            }

            // Check if email already exists
            if (!string.IsNullOrWhiteSpace(request.Email) &&
                Users.Any(u => u.Email == request.Email))
            {
                throw new InvalidOperationException("Email already exists");
            }

            // Simulate async operation
            await Task.Delay(100);

            // Create new user
            var newUser = new UserData
            {
                Id = _nextUserId++,
                Username = request.Username,
                Password = request.Password, // In production, hash this password
                Name = request.Name,
                Email = request.Email ?? string.Empty,
                Phone = request.Phone ?? string.Empty,
                Role = "user",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            Users.Add(newUser);

            // Generate token for newly registered user
            var token = _tokenService.GenerateToken(newUser.Id, newUser.Username, newUser.Role);
            var expiresIn = _tokenService.GetTokenExpirationSeconds();

            return new AuthResponse
            {
                AccessToken = token,
                UserId = newUser.Id,
                Username = newUser.Username,
                Name = newUser.Name,
                Email = newUser.Email,
                Phone = newUser.Phone,
                Role = newUser.Role,
                ExpiresIn = expiresIn
            };
        }

        /// <summary>
        /// Get current user profile
        /// </summary>
        public async Task<UserProfile?> GetUserProfileAsync(int userId)
        {
            // Simulate async operation
            await Task.Delay(50);

            var user = Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
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

        /// <summary>
        /// Update user profile
        /// </summary>
        public async Task<UserProfile?> UpdateUserProfileAsync(int userId, string name, string email, string phone, string location, string address, string city, string state, string zipCode, string country)
        {
            // Simulate async operation
            await Task.Delay(100);

            var user = Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                return null;
            }

            // Check if email is being changed and already exists
            if (!string.IsNullOrWhiteSpace(email) &&
                email != user.Email &&
                Users.Any(u => u.Email == email))
            {
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

            // Note: In-memory service doesn't store address fields
            // These parameters are accepted to match interface but not persisted

            user.UpdatedAt = DateTime.UtcNow;

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

        /// <summary>
        /// Verify if a user exists
        /// </summary>
        public async Task<bool> UserExistsAsync(int userId)
        {
            // Simulate async operation
            await Task.Delay(50);
            return Users.Any(u => u.Id == userId);
        }

        /// <summary>
        /// Internal user data model
        /// </summary>
        private class UserData
        {
            public int Id { get; set; }
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Role { get; set; } = "user";
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
        }
    }
}
