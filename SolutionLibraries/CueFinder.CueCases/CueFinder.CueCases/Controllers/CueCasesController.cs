using System.Security.Claims;
using CueFinder.CueCases.Interfaces;
using CueFinder.CueCases.Models;
using CueFinder.Extensions.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueCases.Controllers;

/// <summary>
/// API Controller for cue case management operations
/// Split into partial classes for better organization and maintainability
/// 
/// Partial Classes:
/// - CueCasesController.cs - Base class and constructor (this file)
/// - CueCasesController.QueryOperations.cs - GET operations and search
/// - CueCasesController.CrudOperations.cs - POST, PUT, DELETE operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public partial class CueCasesController : BaseApiController
{
    private readonly ICueCaseService _cueCaseService;
    private readonly ILogger<CueCasesController> _logger;

    public CueCasesController(ICueCaseService cueCaseService, ILogger<CueCasesController> logger)
    {
        _cueCaseService = cueCaseService;
        _logger = logger;
    }
}
