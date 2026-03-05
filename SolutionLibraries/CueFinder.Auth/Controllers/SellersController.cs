using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using System.Security.Claims;

namespace CueFinder.Auth.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SellersController : ControllerBase
    {
        private readonly CueFinderDbContext _db;
        private readonly ILogger<SellersController> _logger;

        public SellersController(CueFinderDbContext db, ILogger<SellersController> logger)
        {
            _db = db;
            _logger = logger;
        }

        // ── DTOs ────────────────────────────────────────────────────────────────

        public class SellerListingDto
        {
            public int Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public string Brand { get; set; } = string.Empty;
            public string? ImageUrl { get; set; }
            public decimal Price { get; set; }
            public bool IsSold { get; set; }
            public string ListingType { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
        }

        public class SellerRaffleDto
        {
            public int Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public string? ItemImageUrl { get; set; }
            public decimal PricePerSpot { get; set; }
            public int TotalSpots { get; set; }
            public string Status { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
            public DateTime EndsAt { get; set; }
        }

        public class SellerReviewDto
        {
            public int Id { get; set; }
            public int ReviewerId { get; set; }
            public string ReviewerName { get; set; } = string.Empty;
            public int RatingValue { get; set; }
            public string? ReviewText { get; set; }
            public string? ListingType { get; set; }
            public int? ListingId { get; set; }
            public string? ListingTitle { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        public class SellerProfileDto
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Username { get; set; } = string.Empty;
            public string? Location { get; set; }
            public string? City { get; set; }
            public string? Country { get; set; }
            public bool IsVerified { get; set; }
            public DateTime MemberSince { get; set; }
            public double AverageRating { get; set; }
            public int ReviewCount { get; set; }
            public List<SellerListingDto> ActiveListings { get; set; } = new();
            public List<SellerListingDto> SoldListings { get; set; } = new();
            public List<SellerRaffleDto> Raffles { get; set; } = new();
            public List<SellerReviewDto> Reviews { get; set; } = new();
        }

        public class CreateReviewRequest
        {
            public string ListingType { get; set; } = string.Empty;
            public int ListingId { get; set; }
            public int RatingValue { get; set; }
            public string? ReviewText { get; set; }
        }

        // ── GET /api/sellers/{id} ────────────────────────────────────────────────

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(SellerProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProfile(int id)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound(new { message = "Seller not found" });

            // Active listings (all 4 types)
            var activeCues = await _db.Cues.AsNoTracking()
                .Include(c => c.Images)
                .Where(c => c.UserId == id && !c.IsSold && !c.IsHidden)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new SellerListingDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Brand = c.Brand,
                    ImageUrl = c.Images != null ? c.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() : null,
                    Price = c.Price,
                    IsSold = c.IsSold,
                    ListingType = "cue",
                    CreatedAt = c.CreatedAt
                }).ToListAsync();

            var activeCases = await _db.CueCases.AsNoTracking()
                .Include(c => c.Images)
                .Where(c => c.UserId == id && !c.IsSold && !c.IsHidden)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new SellerListingDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Brand = c.Brand,
                    ImageUrl = c.Images != null ? c.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() : null,
                    Price = c.Price,
                    IsSold = c.IsSold,
                    ListingType = "case",
                    CreatedAt = c.CreatedAt
                }).ToListAsync();

            var activeTables = await _db.BilliardTables.AsNoTracking()
                .Include(t => t.Images)
                .Where(t => t.UserId == id && !t.IsSold && !t.IsHidden)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new SellerListingDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Brand = t.Brand,
                    ImageUrl = t.Images != null ? t.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() : null,
                    Price = t.Price,
                    IsSold = t.IsSold,
                    ListingType = "table",
                    CreatedAt = t.CreatedAt
                }).ToListAsync();

            var activeAccessories = await _db.Accessories.AsNoTracking()
                .Include(a => a.Images)
                .Where(a => a.UserId == id && !a.IsSold && !a.IsHidden)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new SellerListingDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Brand = a.Brand,
                    ImageUrl = a.Images != null ? a.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() : null,
                    Price = a.Price,
                    IsSold = a.IsSold,
                    ListingType = "accessory",
                    CreatedAt = a.CreatedAt
                }).ToListAsync();

            // Sold listings
            var soldCues = await _db.Cues.AsNoTracking()
                .Include(c => c.Images)
                .Where(c => c.UserId == id && c.IsSold)
                .OrderByDescending(c => c.UpdatedAt)
                .Take(30)
                .Select(c => new SellerListingDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Brand = c.Brand,
                    ImageUrl = c.Images != null ? c.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() : null,
                    Price = c.Price,
                    IsSold = true,
                    ListingType = "cue",
                    CreatedAt = c.CreatedAt
                }).ToListAsync();

            var soldCases = await _db.CueCases.AsNoTracking()
                .Include(c => c.Images)
                .Where(c => c.UserId == id && c.IsSold)
                .OrderByDescending(c => c.UpdatedAt)
                .Take(30)
                .Select(c => new SellerListingDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Brand = c.Brand,
                    ImageUrl = c.Images != null ? c.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() : null,
                    Price = c.Price,
                    IsSold = true,
                    ListingType = "case",
                    CreatedAt = c.CreatedAt
                }).ToListAsync();

            var soldTables = await _db.BilliardTables.AsNoTracking()
                .Include(t => t.Images)
                .Where(t => t.UserId == id && t.IsSold)
                .OrderByDescending(t => t.UpdatedAt)
                .Take(30)
                .Select(t => new SellerListingDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Brand = t.Brand,
                    ImageUrl = t.Images != null ? t.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() : null,
                    Price = t.Price,
                    IsSold = true,
                    ListingType = "table",
                    CreatedAt = t.CreatedAt
                }).ToListAsync();

            var soldAccessories = await _db.Accessories.AsNoTracking()
                .Include(a => a.Images)
                .Where(a => a.UserId == id && a.IsSold)
                .OrderByDescending(a => a.UpdatedAt)
                .Take(30)
                .Select(a => new SellerListingDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Brand = a.Brand,
                    ImageUrl = a.Images != null ? a.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault() : null,
                    Price = a.Price,
                    IsSold = true,
                    ListingType = "accessory",
                    CreatedAt = a.CreatedAt
                }).ToListAsync();

            // Raffles
            var raffles = await _db.Raffles.AsNoTracking()
                .Where(r => r.OrganizerId == id)
                .OrderByDescending(r => r.CreatedAt)
                .Take(20)
                .Select(r => new SellerRaffleDto
                {
                    Id = r.Id,
                    Title = r.Title,
                    ItemImageUrl = r.ItemImageUrl,
                    PricePerSpot = r.PricePerSpot,
                    TotalSpots = r.TotalSpots,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt,
                    EndsAt = r.EndsAt
                }).ToListAsync();

            // Reviews received by this seller (wrapped in try/catch in case migration is pending)
            var reviewDtos = new List<SellerReviewDto>();
            try
            {
                var reviews = await _db.Ratings.AsNoTracking()
                    .Include(r => r.RatedByUser)
                    .Where(r => r.SellerUserId == id && r.ListingType != null)
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(50)
                    .ToListAsync();

                foreach (var r in reviews)
                {
                    string? listingTitle = null;
                    if (r.ListingType != null && r.ListingId.HasValue)
                    {
                        listingTitle = r.ListingType switch
                        {
                            "cue" => await _db.Cues.Where(c => c.Id == r.ListingId.Value).Select(c => c.Brand + " " + c.Title).FirstOrDefaultAsync(),
                            "case" => await _db.CueCases.Where(c => c.Id == r.ListingId.Value).Select(c => c.Brand + " " + c.Title).FirstOrDefaultAsync(),
                            "table" => await _db.BilliardTables.Where(t => t.Id == r.ListingId.Value).Select(t => t.Brand + " " + t.Title).FirstOrDefaultAsync(),
                            "accessory" => await _db.Accessories.Where(a => a.Id == r.ListingId.Value).Select(a => a.Brand + " " + a.Title).FirstOrDefaultAsync(),
                            _ => null
                        };
                    }
                    reviewDtos.Add(new SellerReviewDto
                    {
                        Id = r.Id,
                        ReviewerId = r.RatedByUserId,
                        ReviewerName = r.RatedByUser?.Name ?? r.RatedByUser?.Username ?? "User",
                        RatingValue = r.RatingValue,
                        ReviewText = r.ReviewText,
                        ListingType = r.ListingType,
                        ListingId = r.ListingId,
                        ListingTitle = listingTitle?.Trim(),
                        CreatedAt = r.CreatedAt
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not load reviews for seller {SellerId} — migration may be pending", id);
            }

            double avgRating = reviewDtos.Count > 0 ? reviewDtos.Average(r => r.RatingValue) : 0;

            var profile = new SellerProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Location = user.Location,
                City = user.City,
                Country = user.Country,
                IsVerified = user.IsVerified,
                MemberSince = user.CreatedAt,
                AverageRating = Math.Round(avgRating, 1),
                ReviewCount = reviewDtos.Count,
                ActiveListings = activeCues.Concat(activeCases).Concat(activeTables).Concat(activeAccessories)
                    .OrderByDescending(l => l.CreatedAt).ToList(),
                SoldListings = soldCues.Concat(soldCases).Concat(soldTables).Concat(soldAccessories)
                    .OrderByDescending(l => l.CreatedAt).ToList(),
                Raffles = raffles,
                Reviews = reviewDtos
            };

            return Ok(profile);
        }

        // ── POST /api/sellers/{id}/reviews ──────────────────────────────────────

        [HttpPost("{id:int}/reviews")]
        [Authorize]
        [ProducesResponseType(typeof(SellerReviewDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CreateReview(int id, [FromBody] CreateReviewRequest req)
        {
            var reviewerIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(reviewerIdStr, out int reviewerId))
                return Unauthorized();

            if (reviewerId == id)
                return BadRequest(new { message = "You cannot review yourself." });

            if (req.RatingValue < 1 || req.RatingValue > 5)
                return BadRequest(new { message = "Rating must be between 1 and 5." });

            var validTypes = new[] { "cue", "case", "table", "accessory" };
            if (!validTypes.Contains(req.ListingType))
                return BadRequest(new { message = "Invalid listing type." });

            // Verify the listing exists and is sold
            bool listingSold = req.ListingType switch
            {
                "cue" => await _db.Cues.AnyAsync(c => c.Id == req.ListingId && c.UserId == id && c.IsSold),
                "case" => await _db.CueCases.AnyAsync(c => c.Id == req.ListingId && c.UserId == id && c.IsSold),
                "table" => await _db.BilliardTables.AnyAsync(t => t.Id == req.ListingId && t.UserId == id && t.IsSold),
                "accessory" => await _db.Accessories.AnyAsync(a => a.Id == req.ListingId && a.UserId == id && a.IsSold),
                _ => false
            };

            if (!listingSold)
                return BadRequest(new { message = "Listing not found or not yet sold." });

            // Verify reviewer is the actual buyer (has any accepted offer message from this seller)
            // Message.CueId only exists for cue listings; other listing types store context in Content JSON,
            // so we check for any accepted message from this seller to this buyer.
            bool isVerifiedBuyer = await _db.Messages.AnyAsync(m =>
                m.MessageType == "accepted" &&
                m.SenderId == id &&            // seller sent the acceptance
                m.RecipientId == reviewerId);  // to this buyer

            if (!isVerifiedBuyer)
                return BadRequest(new { message = "Only the buyer of this listing can leave a review." });

            // Check for duplicate review
            bool alreadyReviewed = await _db.Ratings.AnyAsync(r =>
                r.RatedByUserId == reviewerId &&
                r.ListingType == req.ListingType &&
                r.ListingId == req.ListingId);

            if (alreadyReviewed)
                return BadRequest(new { message = "You have already reviewed this listing." });

            var seller = await _db.Users.FindAsync(id);
            if (seller == null) return NotFound(new { message = "Seller not found" });

            var now = DateTime.UtcNow;
            var rating = new Rating
            {
                RatedByUserId = reviewerId,
                SellerUserId = id,
                RatingValue = req.RatingValue,
                ReviewText = req.ReviewText,
                ListingType = req.ListingType,
                ListingId = req.ListingId,
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.Ratings.Add(rating);
            await _db.SaveChangesAsync();

            var reviewer = await _db.Users.FindAsync(reviewerId);
            return CreatedAtAction(nameof(GetProfile), new { id }, new SellerReviewDto
            {
                Id = rating.Id,
                ReviewerId = reviewerId,
                ReviewerName = reviewer?.Name ?? reviewer?.Username ?? "User",
                RatingValue = rating.RatingValue,
                ReviewText = rating.ReviewText,
                ListingType = rating.ListingType,
                ListingId = rating.ListingId,
                CreatedAt = rating.CreatedAt
            });
        }

        // ── GET /api/sellers/{id}/review-check ──────────────────────────────────

        [HttpGet("{id:int}/review-check")]
        [Authorize]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> CheckReview(int id, [FromQuery] string listingType, [FromQuery] int listingId)
        {
            var reviewerIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(reviewerIdStr, out int reviewerId))
                return Unauthorized();

            bool hasReviewed = await _db.Ratings.AnyAsync(r =>
                r.RatedByUserId == reviewerId &&
                r.SellerUserId == id &&
                r.ListingType == listingType &&
                r.ListingId == listingId);

            bool isEligible = await _db.Messages.AnyAsync(m =>
                m.MessageType == "accepted" &&
                m.SenderId == id &&
                m.RecipientId == reviewerId);

            return Ok(new { hasReviewed, isEligible });
        }
    }
}
