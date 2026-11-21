using FactoringModule.Application.DTOs.Clients;
using FactoringModule.Application.Interfaces;
using FactoringModule.Domain.Enums;
using FactoringModule.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoringModule.Infrastructure.Services;

public class ClientService : IClientService
{
    private readonly FactoringDbContext _context;

    public ClientService(FactoringDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClientDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // AsNoTracking() ускоряет чтение; Select() решает проблему N+1 и убирает циклы JSON!
        return await _context.Clients
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new ClientDto
            {
                Id = c.Id,
                Name = c.Name,
                Unp = c.Unp,
                Iban = c.Iban,
                FactoringLimit = c.FactoringLimit,
                UsedLimit = c.UsedLimit,
                AvailableLimit = Math.Max(0, c.FactoringLimit - c.UsedLimit),
                Rating = c.Rating.ToString(),
                ActiveContractsCount = c.Contracts.Count(ct => ct.Status == ContractStatus.Active)
            })
            .ToListAsync(cancellationToken);
    }
}