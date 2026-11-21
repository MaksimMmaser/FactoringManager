using FactoringModule.Application.DTOs.Contracts;

namespace FactoringModule.Application.Interfaces;

public interface IContractService
{
    Task<List<ContractDto>> GetAllAsync(
        Guid? clientId = null,
        string? factoringType = null,
        CancellationToken cancellationToken = default);

    Task<ContractDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ContractDto> CreateAsync(CreateContractDto dto, CancellationToken cancellationToken = default);
}