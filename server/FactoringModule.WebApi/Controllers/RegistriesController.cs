using FactoringModule.Application.DTOs.Registries;
using FactoringModule.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FactoringModule.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegistriesController : ControllerBase
{
    private readonly IRegistryService _registryService;

    public RegistriesController(IRegistryService registryService)
    {
        _registryService = registryService;
    }

    [HttpGet]
    public async Task<ActionResult<List<RegistryDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _registryService.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RegistryDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var registry = await _registryService.GetByIdAsync(id, cancellationToken);
        return registry is null ? NotFound(new { message = "Реестр не найден" }) : Ok(registry);
    }

    [HttpPost]
    public async Task<ActionResult<RegistryDto>> Create([FromBody] CreateRegistryDto dto, CancellationToken cancellationToken)
    {
            var created = await _registryService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}