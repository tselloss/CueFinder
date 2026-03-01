using CueFinder.Raffles.Models;

namespace CueFinder.Raffles.Interfaces;

public interface IRaffleService
{
    Task<List<RaffleResponseDto>> GetAllRafflesAsync(string? status = null);
    Task<RaffleResponseDto?> GetRaffleByIdAsync(int raffleId);
    Task<List<RaffleResponseDto>> GetMyRafflesAsync(int userId);
    Task<List<RaffleResponseDto>> GetMyEntriesAsync(int userId);

    Task<RaffleResponseDto> CreateRaffleAsync(CreateRaffleDto dto, int organizerId);
    Task<RaffleResponseDto?> UpdateRaffleAsync(int raffleId, CreateRaffleDto dto, int requestingUserId);
    Task<bool> DeleteRaffleAsync(int raffleId, int requestingUserId, bool isAdmin);

    Task<RaffleEntryResponseDto> EnterRaffleAsync(int raffleId, EnterRaffleDto dto, int userId);
    Task<RaffleEntryResponseDto?> VerifyEntryAsync(int raffleId, int entryId, VerifyEntryDto dto, int requestingUserId);

    Task<RaffleResponseDto?> DrawWinnerAsync(int raffleId, int requestingUserId);
}
