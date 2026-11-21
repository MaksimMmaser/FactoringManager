using FactoringModule.Application.DTOs.Contracts;
using FactoringModule.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FactoringModule.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContractsController : ControllerBase
{
    private readonly IContractService _contractService;

    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    // Query Parameters: GET /api/contracts?clientId=...&type=WithRecourse
    [HttpGet]
    public async Task<ActionResult<List<ContractDto>>> GetAll(
        [FromQuery] Guid? clientId,
        [FromQuery] string? type,
        CancellationToken cancellationToken)
    {
        var contracts = await _contractService.GetAllAsync(clientId, type, cancellationToken);
        return Ok(contracts);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ContractDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var contract = await _contractService.GetByIdAsync(id, cancellationToken);
        return contract is null ? NotFound(new { message = "Договор не найден" }) : Ok(contract);
    }

    [HttpPost]
    public async Task<ActionResult<ContractDto>> Create([FromBody] CreateContractDto dto, CancellationToken cancellationToken)
    {
        var created = await _contractService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}