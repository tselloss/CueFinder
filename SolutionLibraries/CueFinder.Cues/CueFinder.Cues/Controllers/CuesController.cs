using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Models;
using CueFinder.Extensions.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.Cues.Controllers;

/// <summary>
/// API Controller for cue management operations
/// Split into partial classes for better organization and maintainability
/// 
/// Partial Classes:
/// - CuesController.cs - Base class and constructor (this file)
/// - CuesController.QueryOperations.cs - GET operations and search
/// - CuesController.CrudOperations.cs - POST, PUT, DELETE operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public partial class CuesController : BaseApiController
{
    private readonly ICueService _cueService;
    private readonly ILogger<CuesController> _logger;

    public CuesController(ICueService cueService, ILogger<CuesController> logger)
    {
        _cueService = cueService;
        _logger = logger;
    }
}
