using System.ComponentModel.DataAnnotations;

namespace CueFinder.Raffles.Models;

public class EnterRaffleDto
{
    [Range(1, 1000)]
    public int SpotNumber { get; set; }

    /// <summary>
    /// The payment method the buyer intends to use (e.g. "paypal", "revolut", "bankTransfer", "viva", "iris", "dm")
    /// </summary>
    [MaxLength(50)]
    public string? ChosenPaymentMethod { get; set; }
}
