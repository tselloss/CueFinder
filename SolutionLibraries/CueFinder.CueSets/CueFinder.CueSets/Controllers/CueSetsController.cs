using CueFinder.CueSets.Interfaces;
using CueFinder.Extensions.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueSets.Controllers;

[ApiController]
[Route("api/[controller]")]
public partial class CueSetsController : BaseApiController
{
    private readonly ICueSetService _cueSetService;
    private readonly ILogger<CueSetsController> _logger;

    public CueSetsController(ICueSetService cueSetService, ILogger<CueSetsController> logger)
    {
        _cueSetService = cueSetService;
        _logger = logger;
    }
}
