using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using CueFinder.Database.Services;
using CueFinder.Auth.Models;
using Microsoft.Extensions.Logging;

namespace CueFinder.Auth.Controllers
{
    /// <summary>
    /// Admin endpoints for managing users
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        /// <summary>
        /// List all users
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<UserProfile>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllUsersAsync();
            var list = users.Select(u => new UserProfile
            {
                Id = u.Id,
                Username = u.Username,
                Name = u.Name,
                Email = u.Email,
                Phone = u.Phone,
                HidePhone = u.HidePhone,
                Role = u.Role,
                IsActive = u.IsActive,
                IsVerified = u.IsVerified,
                Address = u.Address,
                City = u.City,
                State = u.State,
                ZipCode = u.ZipCode,
                Country = u.Country,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                Location = u.Location
            }).ToList();
            return Ok(list);
        }

        public class UpdateUserAdminRequest
        {
            public string? Name { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
            public string? Role { get; set; }
            public bool? IsActive { get; set; }
            public bool? IsVerified { get; set; }
        }

        /// <summary>
        /// Update a user (admin)
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(UserProfile), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserAdminRequest req)
        {
            var user = await _userService.GetUserWithDetailsAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (!string.IsNullOrWhiteSpace(req.Name)) user.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.Email)) user.Email = req.Email;
            if (!string.IsNullOrWhiteSpace(req.Phone)) user.Phone = req.Phone;
            if (!string.IsNullOrWhiteSpace(req.Role)) user.Role = req.Role;
            if (req.IsActive.HasValue) user.IsActive = req.IsActive.Value;
            if (req.IsVerified.HasValue) user.IsVerified = req.IsVerified.Value;

            var updated = await _userService.UpdateUserAsync(user);
            var profile = new UserProfile
            {
                Id = updated.Id,
                Username = updated.Username,
                Name = updated.Name,
                Email = updated.Email,
                Phone = updated.Phone,
                HidePhone = updated.HidePhone,
                Role = updated.Role,
                IsActive = updated.IsActive,
                IsVerified = updated.IsVerified,
                Address = updated.Address,
                City = updated.City,
                State = updated.State,
                ZipCode = updated.ZipCode,
                Country = updated.Country,
                CreatedAt = updated.CreatedAt,
                UpdatedAt = updated.UpdatedAt,
                Location = updated.Location
            };
            return Ok(profile);
        }

        /// <summary>
        /// Delete a user (admin)
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _userService.DeleteUserAsync(id);
            if (!ok) return NotFound(new { message = "User not found" });
            return Ok(new { success = true });
        }
    }
}
