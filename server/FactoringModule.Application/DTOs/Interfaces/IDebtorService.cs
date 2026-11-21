using FactoringModule.Application.DTOs.Debtors;

namespace FactoringModule.Application.Interfaces;

public interface IDebtorService
{
    Task<List<DebtorDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<DebtorDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DebtorDto> CreateAsync(CreateDebtorDto dto, CancellationToken cancellationToken = default);
}