namespace CueFinder.CueSets.Models;

public class UpdateCueSetDto
{
    public string? Title { get; set; }
    public string? Brand { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string? Condition { get; set; }
    public string? Location { get; set; }

    public bool? IncludesPlayingCue { get; set; }
    public bool? IncludesBreakCue { get; set; }
    public bool? IncludesJumpCue { get; set; }
    public bool? IncludesCase { get; set; }

    public decimal? PlayingCueWeight { get; set; }
    public decimal? PlayingCueLength { get; set; }
    public decimal? PlayingCueTipSize { get; set; }
    public string? PlayingCueShaftMaterial { get; set; }
    public string? PlayingCueButtMaterial { get; set; }

    public decimal? BreakCueWeight { get; set; }
    public decimal? BreakCueLength { get; set; }
    public decimal? BreakCueTipSize { get; set; }
    public string? BreakCueShaftMaterial { get; set; }
    public string? BreakCueButtMaterial { get; set; }

    public decimal? JumpCueWeight { get; set; }
    public decimal? JumpCueLength { get; set; }
    public decimal? JumpCueTipSize { get; set; }
    public string? JumpCueShaftMaterial { get; set; }
    public string? JumpCueButtMaterial { get; set; }

    public string? CaseCapacity { get; set; }
    public string? CaseOpening { get; set; }
    public string? CaseType { get; set; }
    public string? CaseColor { get; set; }
    public string? CaseMaterial { get; set; }

    public string? Features { get; set; }
    public bool? IsSold { get; set; }
    public bool? IsHidden { get; set; }
    public DateTime? HiddenAt { get; set; }
    public DateTime? LastUserResponseAt { get; set; }
}
