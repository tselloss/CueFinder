using System.ComponentModel.DataAnnotations;

namespace CueFinder.Raffles.Models;

public class EnterRaffleDto
{
    [Range(1, 1000)]
    public int SpotNumber { get; set; }
}
