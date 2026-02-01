using System.Security.Claims;
using CueFinder.Accessories.Interfaces;
using CueFinder.Accessories.Models;
using CueFinder.Extensions.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.Accessories.Controllers;

/// <summary>
/// API Controller for accessory management operations
/// Split into partial classes for better organization and maintainability
/// 
/// Partial Classes:
/// - AccessoriesController.cs - Base class and constructor (this file)
/// - AccessoriesController.QueryOperations.cs - GET operations and search
/// - AccessoriesController.CrudOperations.cs - POST, PUT, DELETE operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public partial class AccessoriesController : BaseApiController
{
    private readonly IAccessoryService _accessoryService;
    private readonly IImageService _imageService;
    private readonly ILogger<AccessoriesController> _logger;

    public AccessoriesController(IAccessoryService accessoryService, IImageService imageService, ILogger<AccessoriesController> logger)
    {
        _accessoryService = accessoryService;
        _imageService = imageService;
        _logger = logger;
    }
}
