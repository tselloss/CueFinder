using CueFinder.Extensions.Controllers;
using CueFinder.Raffles.Interfaces;
using CueFinder.Raffles.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.Raffles.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RafflesController : BaseApiController
{
    private readonly IRaffleService _raffleService;
    private readonly ILogger<RafflesController> _logger;

    public RafflesController(IRaffleService raffleService, ILogger<RafflesController> logger)
    {
        _raffleService = raffleService;
        _logger = logger;
    }

    // ── Public browse ──────────────────────────────────────────────────────────

    [HttpGet]
    [ProducesResponseType(typeof(List<RaffleResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<RaffleResponseDto>>> GetAll([FromQuery] string? status = null)
    {
        try
        {
            return Ok(await _raffleService.GetAllRafflesAsync(status));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching raffles");
            return StatusCode(500, new { message = "Error fetching raffles" });
        }
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(RaffleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RaffleResponseDto>> GetById(int id)
    {
        try
        {
            var raffle = await _raffleService.GetRaffleByIdAsync(id);
            return raffle == null ? NotFound(new { message = "Raffle not found" }) : Ok(raffle);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching raffle {Id}", id);
            return StatusCode(500, new { message = "Error fetching raffle" });
        }
    }

    // ── Auth-required ──────────────────────────────────────────────────────────

    [HttpGet("my-raffles")]
    [Authorize]
    [ProducesResponseType(typeof(List<RaffleResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<RaffleResponseDto>>> GetMyRaffles()
    {
        try
        {
            return Ok(await _raffleService.GetMyRafflesAsync(GetCurrentUserId()));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user raffles");
            return StatusCode(500, new { message = "Error fetching your raffles" });
        }
    }

    [HttpGet("my-entries")]
    [Authorize]
    [ProducesResponseType(typeof(List<RaffleResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<RaffleResponseDto>>> GetMyEntries()
    {
        try
        {
            return Ok(await _raffleService.GetMyEntriesAsync(GetCurrentUserId()));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user entries");
            return StatusCode(500, new { message = "Error fetching your entries" });
        }
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(RaffleResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RaffleResponseDto>> Create([FromBody] CreateRaffleDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var raffle = await _raffleService.CreateRaffleAsync(dto, GetCurrentUserId());
            return CreatedAtAction(nameof(GetById), new { id = raffle.Id }, raffle);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating raffle");
            return StatusCode(500, new { message = "Error creating raffle", error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(RaffleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RaffleResponseDto>> Update(int id, [FromBody] CreateRaffleDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var raffle = await _raffleService.UpdateRaffleAsync(id, dto, GetCurrentUserId());
            return raffle == null ? NotFound(new { message = "Raffle not found" }) : Ok(raffle);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating raffle {Id}", id);
            return StatusCode(500, new { message = "Error updating raffle" });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            var success = await _raffleService.DeleteRaffleAsync(id, GetCurrentUserId(), IsAdmin());
            return success ? NoContent() : NotFound(new { message = "Raffle not found" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting raffle {Id}", id);
            return StatusCode(500, new { message = "Error deleting raffle" });
        }
    }

    [HttpPost("{id:int}/enter")]
    [Authorize]
    [ProducesResponseType(typeof(RaffleEntryResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RaffleEntryResponseDto>> Enter(int id, [FromBody] EnterRaffleDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var entry = await _raffleService.EnterRaffleAsync(id, dto, GetCurrentUserId());
            return StatusCode(201, entry);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error entering raffle {Id}", id);
            return StatusCode(500, new { message = "Error entering raffle" });
        }
    }

    [HttpPut("{id:int}/entries/{entryId:int}/verify")]
    [Authorize]
    [ProducesResponseType(typeof(RaffleEntryResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RaffleEntryResponseDto>> VerifyEntry(int id, int entryId, [FromBody] VerifyEntryDto dto)
    {
        try
        {
            var entry = await _raffleService.VerifyEntryAsync(id, entryId, dto, GetCurrentUserId());
            return entry == null ? NotFound(new { message = "Entry not found" }) : Ok(entry);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying entry {EntryId} in raffle {Id}", entryId, id);
            return StatusCode(500, new { message = "Error verifying entry" });
        }
    }

    [HttpPost("{id:int}/draw")]
    [Authorize]
    [ProducesResponseType(typeof(RaffleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RaffleResponseDto>> DrawWinner(int id)
    {
        try
        {
            var raffle = await _raffleService.DrawWinnerAsync(id, GetCurrentUserId());
            return raffle == null ? NotFound(new { message = "Raffle not found" }) : Ok(raffle);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error drawing winner for raffle {Id}", id);
            return StatusCode(500, new { message = "Error drawing winner" });
        }
    }
}
