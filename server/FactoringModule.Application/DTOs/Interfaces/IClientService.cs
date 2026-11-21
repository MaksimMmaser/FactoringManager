using FactoringModule.Application.DTOs.Clients;

namespace FactoringModule.Application.Interfaces;

public interface IClientService
{
    Task<List<ClientDto>> GetAllAsync(CancellationToken cancellationToken = default);
}