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
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
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
                    return BadRequest(new { message = "Username and password are required" });
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
                    return BadRequest(new { message = "Username, password, and name are required" });
                }

                if (request.Password.Length < 6)
                {
                    return BadRequest(new { message = "Password must be at least 6 characters long" });
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
                    return NotFound(new { message = "User not found" });
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
                    return NotFound(new { message = "User not found" });
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
                    request.Phone ?? string.Empty
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
    }
}
