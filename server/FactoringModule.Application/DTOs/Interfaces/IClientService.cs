using FactoringModule.Application.DTOs.Clients;

namespace FactoringModule.Application.Interfaces;

public interface IClientService
{
    Task<List<ClientDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ClientDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ClientDto> CreateAsync(CreateClientDto dto, CancellationToken cancellationToken = default);
}