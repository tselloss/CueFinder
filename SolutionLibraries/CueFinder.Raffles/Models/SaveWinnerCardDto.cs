using System.ComponentModel.DataAnnotations;

namespace CueFinder.Raffles.Models;

public class SaveWinnerCardDto
{
    [Required, MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;
}
