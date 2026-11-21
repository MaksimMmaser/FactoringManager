using FactoringModule.Application.DTOs.Clients;
using FactoringModule.Application.Interfaces;
using FactoringModule.Domain.Entities;
using FactoringModule.Domain.Enums;
using FactoringModule.Infrastructure.Persistence;
using FactoringModule.Domain.Exceptions;
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

    public async Task<ClientDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Clients
            .AsNoTracking()
            .Where(c => c.Id == id)
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
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<ClientDto> CreateAsync(CreateClientDto dto, CancellationToken cancellationToken = default)
    {
        // Проверяем уникальность УНП до сохранения
        var unpExists = await _context.Clients
            .AnyAsync(c => c.Unp == dto.Unp, cancellationToken);

        if (unpExists)
            throw new ConflictException($"Клиент с УНП {dto.Unp} уже зарегистрирован в системе.");

        if (!Enum.TryParse<ClientRating>(dto.Rating, ignoreCase: true, out var parsedRating))
            parsedRating = ClientRating.A;

        var client = new Client
        {
            Name = dto.Name.Trim(),
            Unp = dto.Unp.Trim(),
            Iban = dto.Iban.Trim().ToUpperInvariant(),
            FactoringLimit = dto.FactoringLimit,
            UsedLimit = 0m, // Жестко обнуляем на сервере!
            Rating = parsedRating
        };

        await _context.Clients.AddAsync(client, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new ClientDto
        {
            Id = client.Id,
            Name = client.Name,
            Unp = client.Unp,
            Iban = client.Iban,
            FactoringLimit = client.FactoringLimit,
            UsedLimit = client.UsedLimit,
            AvailableLimit = client.AvailableLimit,
            Rating = client.Rating.ToString(),
            ActiveContractsCount = 0
        };
    }
}