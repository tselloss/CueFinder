using System.ComponentModel.DataAnnotations;

namespace CueFinder.Raffles.Models;

public class VerifyEntryDto
{
    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    [MaxLength(200)]
    public string? PaymentReference { get; set; }
}
