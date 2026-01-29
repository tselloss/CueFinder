using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using CueFinder.Auth.Interfaces;
using CueFinder.Auth.Models;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace CueFinder.Auth.Controllers
{
    /// <summary>
    /// Authentication API endpoints
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IPasswordResetService _passwordResetService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IAuthService authService,
            IPasswordResetService passwordResetService,
            ILogger<AuthController> logger)
        {
            _authService = authService;
            _passwordResetService = passwordResetService;
            _logger = logger;
        }

        /// <summary>
        /// Login with username and password
        /// </summary>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest(new { message = "Please enter both username and password to login" });
                }

                var response = await _authService.LoginAsync(request.Username, request.Password);
                _logger.LogInformation("User {Username} logged in successfully", request.Username);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Login failed for user {Username}: {Message}", request.Username, ex.Message);
                return StatusCode(StatusCodes.Status401Unauthorized, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login error for user {Username}", request.Username);
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        /// <summary>
        /// Register a new user account
        /// </summary>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Username) ||
                    string.IsNullOrWhiteSpace(request.Password) ||
                    string.IsNullOrWhiteSpace(request.Name))
                {
                    return BadRequest(new { message = "Please provide all required information: username, password, and full name" });
                }

                if (request.Password.Length < 6)
                {
                    return BadRequest(new { message = "Password must be at least 6 characters long for your security" });
                }

                var response = await _authService.RegisterAsync(request);
                _logger.LogInformation("New user {Username} registered successfully", request.Username);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Registration failed: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Registration error");
                return StatusCode(500, new { message = "An error occurred during registration" });
            }
        }

        /// <summary>
        /// Get current authenticated user profile
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(UserProfile), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Invalid user claim" });
                }

                var profile = await _authService.GetUserProfileAsync(userId);
                if (profile == null)
                {
                    return NotFound(new { message = "User profile not found. Please contact support if this persists." });
                }

                return Ok(profile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user profile");
                return StatusCode(500, new { message = "An error occurred while retrieving user profile" });
            }
        }

        /// <summary>
        /// Get user profile by ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(UserProfile), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserProfile(int id)
        {
            try
            {
                var profile = await _authService.GetUserProfileAsync(id);
                if (profile == null)
                {
                    return NotFound(new { message = "User profile not found" });
                }

                return Ok(profile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user profile for ID {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving user profile" });
            }
        }

        /// <summary>
        /// Update current user profile
        /// </summary>
        [HttpPut("me")]
        [Authorize]
        [ProducesResponseType(typeof(UserProfile), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UpdateCurrentUserProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Invalid user claim" });
                }

                var profile = await _authService.UpdateUserProfileAsync(
                    userId,
                    request.Name ?? string.Empty,
                    request.Email ?? string.Empty,
                    request.Phone ?? string.Empty,
                    request.Location ?? string.Empty,
                    request.Address ?? string.Empty,
                    request.City ?? string.Empty,
                    request.State ?? string.Empty,
                    request.ZipCode ?? string.Empty,
                    request.Country ?? string.Empty,
                    request.HidePhone
                );

                if (profile == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                _logger.LogInformation("User {UserId} profile updated", userId);
                return Ok(profile);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Profile update failed: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return StatusCode(500, new { message = "An error occurred while updating user profile" });
            }
        }

        /// <summary>
        /// Verify authentication status
        /// </summary>
        [HttpGet("verify")]
        [Authorize]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public IActionResult VerifyToken()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                var usernameClaim = User.FindFirst(ClaimTypes.Name);

                return Ok(new
                {
                    verified = true,
                    userId = userIdClaim?.Value,
                    username = usernameClaim?.Value
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying token");
                return StatusCode(500, new { message = "An error occurred while verifying token" });
            }
        }

        /// <summary>
        /// External OAuth login (Google, Apple)
        /// </summary>
        [HttpPost("external")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ExternalLogin([FromBody] ExternalAuthRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.IdToken))
                {
                    return BadRequest(new { message = "ID token is required" });
                }

                if (string.IsNullOrWhiteSpace(request.Email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                var response = await _authService.ExternalLoginAsync(request);
                _logger.LogInformation("User {Email} logged in via {Provider}", request.Email, request.Provider);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("External login failed: {Message}", ex.Message);
                return StatusCode(StatusCodes.Status401Unauthorized, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "External login error for provider {Provider}", request.Provider);
                return StatusCode(500, new { message = "An error occurred during external login" });
            }
        }

        /// <summary>
        /// Request a password reset link (email-based forgot password)
        /// Returns uniform response regardless of whether account exists (prevents account enumeration)
        /// </summary>
        [HttpPost("forgot-password")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.EmailOrUsername))
                {
                    return BadRequest(new { message = "Email or username is required" });
                }

                // Get client IP for audit logging
                string clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                string userAgent = Request.Headers["User-Agent"].ToString() ?? "unknown";

                // Find user by email or username (no error if not found - privacy)
                var user = await _authService.GetUserByEmailOrUsernameAsync(request.EmailOrUsername);

                if (user != null)
                {
                    // Check rate limiting
                    if (await _passwordResetService.IsResetRequestRateLimitExceededAsync(user.Id))
                    {
                        _logger.LogWarning(
                            "Password reset rate limit exceeded for user {UserId} from IP {IpAddress}",
                            user.Id,
                            clientIp);

                        // Still return 200 OK to not reveal rate limit (uniform response)
                        return Ok(new
                        {
                            message = "If an account exists with that email/username, you will receive a password reset link shortly."
                        });
                    }

                    // Generate reset token
                    string resetToken = await _passwordResetService.GenerateResetTokenAsync(
                        user.Id,
                        clientIp,
                        userAgent);

                    // TODO: Send email with reset link
                    // string resetLink = $"{_configuration["AppUrl"]}/reset-password?token={resetToken}";
                    // await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink, user.Name);

                    _logger.LogInformation(
                        "Password reset requested for user {UserId} ({Email}) from IP {IpAddress}",
                        user.Id,
                        user.Email,
                        clientIp);
                }
                else
                {
                    // Log attempt even if user not found (for security monitoring)
                    _logger.LogInformation(
                        "Password reset requested for non-existent account: {EmailOrUsername} from IP {IpAddress}",
                        request.EmailOrUsername,
                        clientIp);
                }

                // Always return same response (prevents account enumeration attacks)
                return Ok(new
                {
                    message = "If an account exists with that email/username, you will receive a password reset link shortly."
                });
            }
            catch (InvalidOperationException ex)
            {
                // Rate limit exceeded exception
                _logger.LogWarning("Forgot password error: {Message}", ex.Message);
                return StatusCode(StatusCodes.Status429TooManyRequests,
                    new { message = "Too many reset requests. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Forgot password error");
                return StatusCode(500, new { message = "An error occurred processing your request" });
            }
        }

        /// <summary>
        /// Validate a password reset token and user can proceed to reset
        /// </summary>
        [HttpPost("validate-reset-token")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ValidateResetToken([FromBody] ValidateResetTokenRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Token))
                {
                    return BadRequest(new { message = "Reset token is required" });
                }

                int? userId = await _passwordResetService.ValidateResetTokenAsync(request.Token);

                if (!userId.HasValue)
                {
                    _logger.LogWarning("Invalid or expired reset token validation attempt");
                    return StatusCode(StatusCodes.Status401Unauthorized,
                        new { message = "This password reset link has expired or is invalid. Please request a new one." });
                }

                return Ok(new
                {
                    message = "Token is valid. You can now reset your password.",
                    isValid = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating reset token");
                return StatusCode(500, new { message = "An error occurred validating your reset token" });
            }
        }

        /// <summary>
        /// Reset password using a valid token
        /// </summary>
        [HttpPost("reset-password")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Token))
                {
                    return BadRequest(new { message = "Reset token is required" });
                }

                if (string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    return BadRequest(new { message = "New password is required" });
                }

                // Validate password policy
                if (request.NewPassword.Length < 8)
                {
                    return BadRequest(new { message = "Password must be at least 8 characters long" });
                }

                // Validate confirmation password
                if (request.NewPassword != request.ConfirmPassword)
                {
                    return BadRequest(new { message = "Passwords do not match" });
                }

                // Check for common weak passwords
                if (IsCommonPassword(request.NewPassword))
                {
                    return BadRequest(new { message = "This password is too common. Please choose a stronger password." });
                }

                // Perform password reset
                bool success = await _passwordResetService.ResetPasswordAsync(request.Token, request.NewPassword);

                if (!success)
                {
                    _logger.LogWarning("Password reset failed: invalid or expired token");
                    return StatusCode(StatusCodes.Status401Unauthorized,
                        new { message = "This password reset link has expired or is invalid. Please request a new one." });
                }

                _logger.LogInformation("Password reset successful");
                return Ok(new
                {
                    message = "Your password has been reset successfully. Please login with your new password."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Password reset error");
                return StatusCode(500, new { message = "An error occurred resetting your password" });
            }
        }

        /// <summary>
        /// Check if password is in common passwords list (simple check - enhance with wordlist in production)
        /// </summary>
        private bool IsCommonPassword(string password)
        {
            var commonPasswords = new[]
            {
                "password", "123456", "password123", "admin", "letmein", "welcome",
                "monkey", "dragon", "master", "sunshine", "princess", "qwerty"
            };

            return commonPasswords.Any(p => password.Equals(p, StringComparison.OrdinalIgnoreCase));
        }
    }
}
