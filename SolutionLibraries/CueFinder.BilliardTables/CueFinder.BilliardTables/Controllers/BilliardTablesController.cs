using System.Security.Claims;
using CueFinder.BilliardTables.Interfaces;
using CueFinder.BilliardTables.Models;
using CueFinder.Extensions.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.BilliardTables.Controllers;

/// <summary>
/// API Controller for billiard table management operations
/// Split into partial classes for better organization and maintainability
///
/// Partial Classes:
/// - BilliardTablesController.cs - Base class and constructor (this file)
/// - BilliardTablesController.QueryOperations.cs - GET operations and search
/// - BilliardTablesController.CrudOperations.cs - POST, PUT, DELETE operations
/// - BilliardTablesController.Images.cs - Image upload and management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public partial class BilliardTablesController : BaseApiController
{
    private readonly IBilliardTableService _tableService;
    private readonly IImageService _imageService;
    private readonly ILogger<BilliardTablesController> _logger;

    public BilliardTablesController(IBilliardTableService tableService, IImageService imageService, ILogger<BilliardTablesController> logger)
    {
        _tableService = tableService;
        _imageService = imageService;
        _logger = logger;
    }
}
