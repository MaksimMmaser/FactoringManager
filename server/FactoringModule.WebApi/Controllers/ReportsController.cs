using FactoringModule.Application.DTOs.Analytics;
using FactoringModule.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FactoringModule.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public ReportsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    // GET /api/reports/reconciliation?clientId=...
    [HttpGet("reconciliation")]
    public async Task<ActionResult<ReconciliationReportDto>> GetReconciliation(
        [FromQuery] Guid clientId,
        CancellationToken cancellationToken)
    {
       
            return Ok(await _analyticsService.GetReconciliationReportAsync(clientId, cancellationToken));
    }
}