using FactoringModule.Application.DTOs.Registries;

namespace FactoringModule.Application.Interfaces;

public interface IRegistryService
{
    Task<List<RegistryDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<RegistryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RegistryDto> CreateAsync(CreateRegistryDto dto, CancellationToken cancellationToken = default);
}