using FactoringModule.Application.DTOs.Analytics;
using FactoringModule.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FactoringModule.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public DashboardController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard(CancellationToken cancellationToken)
    {
        return Ok(await _analyticsService.GetDashboardAsync(cancellationToken));
    }
}