using CueFinder.Auth.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CueFinderBE.Controllers
{
    [ApiController]
    [Route("api/auth/phone")]
    public class PhoneVerificationController : ControllerBase
    {
        private readonly IPhoneVerificationService _phoneVerificationService;
        private readonly ILogger<PhoneVerificationController> _logger;

        public PhoneVerificationController(
            IPhoneVerificationService phoneVerificationService,
            ILogger<PhoneVerificationController> logger)
        {
            _phoneVerificationService = phoneVerificationService;
            _logger = logger;
        }

        /// <summary>
        /// Initiate phone verification by sending code and magic link
        /// </summary>
        [HttpPost("send-verification")]
        [Authorize]
        public async Task<IActionResult> SendVerification([FromBody] SendVerificationRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                // Validate phone number format
                if (string.IsNullOrWhiteSpace(request.PhoneNumber))
                {
                    return BadRequest(new { message = "Phone number is required" });
                }

                // Check if already verified
                var isVerified = await _phoneVerificationService.IsPhoneVerifiedAsync(userId, request.PhoneNumber);
                if (isVerified)
                {
                    return BadRequest(new { message = "Phone number is already verified" });
                }

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var verificationToken = await _phoneVerificationService.InitiateVerificationAsync(
                    userId,
                    request.PhoneNumber,
                    request.Method ?? "Viber",
                    ipAddress);

                return Ok(new
                {
                    message = "Verification code sent successfully",
                    token = verificationToken.Token,
                    expiresAt = verificationToken.ExpiresAt,
                    method = verificationToken.VerificationMethod
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid request for phone verification");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending phone verification");
                return StatusCode(500, new { message = "Failed to send verification code" });
            }
        }

        /// <summary>
        /// Verify phone using 4-digit code
        /// </summary>
        [HttpPost("verify-code")]
        [Authorize]
        public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.Code))
                {
                    return BadRequest(new { message = "Token and code are required" });
                }

                // Validate code format (4 digits)
                if (request.Code.Length != 4 || !request.Code.All(char.IsDigit))
                {
                    return BadRequest(new { message = "Invalid verification code format" });
                }

                var verified = await _phoneVerificationService.VerifyCodeAsync(request.Token, request.Code);

                if (verified)
                {
                    return Ok(new { message = "Phone verified successfully", verified = true });
                }

                return BadRequest(new { message = "Invalid or expired verification code", verified = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying phone code");
                return StatusCode(500, new { message = "Failed to verify code" });
            }
        }

        /// <summary>
        /// Verify phone using magic link (can be accessed without auth)
        /// </summary>
        [HttpGet("verify-link/{magicLinkToken}")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyMagicLink(string magicLinkToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(magicLinkToken))
                {
                    return BadRequest(new { message = "Invalid magic link token" });
                }

                var verified = await _phoneVerificationService.VerifyMagicLinkAsync(magicLinkToken);

                if (verified)
                {
                    // Redirect to success page in frontend
                    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:3000";
                    return Redirect($"{frontendUrl}/phone-verification-success");
                }

                // Redirect to error page
                var errorUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:3000";
                return Redirect($"{errorUrl}/phone-verification-error");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying magic link");
                var errorUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:3000";
                return Redirect($"{errorUrl}/phone-verification-error");
            }
        }

        /// <summary>
        /// Resend verification code
        /// </summary>
        [HttpPost("resend")]
        [Authorize]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Token))
                {
                    return BadRequest(new { message = "Token is required" });
                }

                var resent = await _phoneVerificationService.ResendVerificationAsync(request.Token);

                if (resent)
                {
                    return Ok(new { message = "Verification code resent successfully" });
                }

                return BadRequest(new { message = "Failed to resend verification code. Please wait or request a new verification." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending verification");
                return StatusCode(500, new { message = "Failed to resend verification code" });
            }
        }

        /// <summary>
        /// Get verification token status
        /// </summary>
        [HttpGet("status/{token}")]
        [Authorize]
        public async Task<IActionResult> GetVerificationStatus(string token)
        {
            try
            {
                var verificationToken = await _phoneVerificationService.GetVerificationTokenAsync(token);

                if (verificationToken == null)
                {
                    return NotFound(new { message = "Verification token not found" });
                }

                return Ok(new
                {
                    isExpired = verificationToken.IsExpired(),
                    isVerified = verificationToken.IsVerified,
                    isUsed = verificationToken.IsUsed,
                    attemptCount = verificationToken.AttemptCount,
                    maxAttempts = verificationToken.MaxAttempts,
                    expiresAt = verificationToken.ExpiresAt,
                    canResend = !verificationToken.IsExpired() && 
                               !verificationToken.IsUsed &&
                               (!verificationToken.LastResentAt.HasValue || 
                                (DateTime.UtcNow - verificationToken.LastResentAt.Value).TotalSeconds >= 60)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting verification status");
                return StatusCode(500, new { message = "Failed to get verification status" });
            }
        }
    }

    // Request/Response models
    public class SendVerificationRequest
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Method { get; set; } = "Viber"; // "Viber" or "SMS"
    }

    public class VerifyCodeRequest
    {
        public string Token { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class ResendVerificationRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}
