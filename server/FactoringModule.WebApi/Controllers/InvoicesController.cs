using FactoringModule.Application.DTOs.Registries;
using FactoringModule.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FactoringModule.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<ActionResult<List<InvoiceDto>>> GetAll(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        return Ok(await _invoiceService.GetAllAsync(status, cancellationToken));
    }

    // Погашение накладной: POST /api/invoices/{id}/repay
    [HttpPost("{id:guid}/repay")]
    public async Task<ActionResult<InvoiceDto>> Repay(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var repaid = await _invoiceService.RepayAsync(id, cancellationToken);
            return Ok(repaid);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }
}