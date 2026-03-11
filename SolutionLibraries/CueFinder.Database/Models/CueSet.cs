namespace CueFinder.Database.Models
{
    /// <summary>
    /// Cue set listing entity — a bundle of any combination of Playing/Break/Jump cues and a case
    /// </summary>
    public class CueSet
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Condition { get; set; } = "good";
        public string Location { get; set; } = string.Empty;

        // ── What's included ──────────────────────────────────────────────────────
        public bool IncludesPlayingCue { get; set; } = false;
        public bool IncludesBreakCue { get; set; } = false;
        public bool IncludesJumpCue { get; set; } = false;
        public bool IncludesCase { get; set; } = false;

        // ── Playing cue specs ────────────────────────────────────────────────────
        public decimal? PlayingCueWeight { get; set; }
        public decimal? PlayingCueLength { get; set; }
        public decimal? PlayingCueTipSize { get; set; }
        public string? PlayingCueShaftMaterial { get; set; }
        public string? PlayingCueButtMaterial { get; set; }

        // ── Break cue specs ──────────────────────────────────────────────────────
        public decimal? BreakCueWeight { get; set; }
        public decimal? BreakCueLength { get; set; }
        public decimal? BreakCueTipSize { get; set; }
        public string? BreakCueShaftMaterial { get; set; }
        public string? BreakCueButtMaterial { get; set; }

        // ── Jump cue specs ───────────────────────────────────────────────────────
        public decimal? JumpCueWeight { get; set; }
        public decimal? JumpCueLength { get; set; }
        public decimal? JumpCueTipSize { get; set; }
        public string? JumpCueShaftMaterial { get; set; }
        public string? JumpCueButtMaterial { get; set; }

        // ── Case specs ───────────────────────────────────────────────────────────
        public string? CaseCapacity { get; set; }
        public string? CaseOpening { get; set; }
        public string? CaseType { get; set; }
        public string? CaseColor { get; set; }
        public string? CaseMaterial { get; set; }

        // ── Additional notes ─────────────────────────────────────────────────────
        public string? Features { get; set; }

        // ── Listing metadata ─────────────────────────────────────────────────────
        public int UserId { get; set; }
        public virtual User? User { get; set; }
        public bool IsSold { get; set; } = false;
        public DateTime? SoldDate { get; set; }
        public int ViewCount { get; set; } = 0;
        public decimal AverageRating { get; set; } = 0;
        public int RatingCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // ── Moderation ───────────────────────────────────────────────────────────
        public bool IsFlagged { get; set; } = false;
        public string? FlagReason { get; set; }
        public string ModerationStatus { get; set; } = "approved";
        public int? ModeratedByUserId { get; set; }
        public DateTime? ModeratedAt { get; set; }
        public string? ModerationNotes { get; set; }

        // ── Old listing management ───────────────────────────────────────────────
        public DateTime? LastPromptedAt { get; set; }
        public DateTime? LastUserResponseAt { get; set; }
        public bool IsHidden { get; set; } = false;
        public DateTime? HiddenAt { get; set; }

        // ── Navigation ───────────────────────────────────────────────────────────
        public virtual ICollection<CueSetImage>? Images { get; set; }
    }
}
