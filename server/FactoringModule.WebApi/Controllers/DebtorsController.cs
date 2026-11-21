using FactoringModule.Application.DTOs.Debtors;
using FactoringModule.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FactoringModule.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebtorsController : ControllerBase
{
    private readonly IDebtorService _debtorService;

    public DebtorsController(IDebtorService debtorService)
    {
        _debtorService = debtorService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DebtorDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _debtorService.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DebtorDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var debtor = await _debtorService.GetByIdAsync(id, cancellationToken);
        return debtor is null ? NotFound(new { message = "Дебитор не найден" }) : Ok(debtor);
    }

    [HttpPost]
    public async Task<ActionResult<DebtorDto>> Create([FromBody] CreateDebtorDto dto, CancellationToken cancellationToken)
    {
        
            var created = await _debtorService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        
        
    }
}