using FactoringModule.Application.DTOs.Contracts;
using FactoringModule.Application.Interfaces;
using FactoringModule.Domain.Entities;
using FactoringModule.Domain.Enums;
using FactoringModule.Infrastructure.Persistence;
using FactoringModule.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace FactoringModule.Infrastructure.Services;

public class ContractService : IContractService
{
    private readonly FactoringDbContext _context;

    public ContractService(FactoringDbContext context)
    {
        _context = context;
    }

    public async Task<List<ContractDto>> GetAllAsync(
        Guid? clientId = null,
        string? factoringType = null,
        CancellationToken cancellationToken = default)
    {
        // Начинаем строить отложенный SQL-запрос (IQueryable)
        var query = _context.Contracts
            .AsNoTracking()
            .AsQueryable();

        // Добавляем WHERE, только если передан параметр clientId
        if (clientId.HasValue)
            query = query.Where(c => c.ClientId == clientId.Value);

        // Добавляем WHERE, если передан фильтр по типу (WithRecourse / WithoutRecourse)
        if (!string.IsNullOrWhiteSpace(factoringType) &&
            Enum.TryParse<FactoringType>(factoringType, ignoreCase: true, out var parsedType))
        {
            query = query.Where(c => c.Type == parsedType);
        }

        // Выполняем ОДИН SQL-запрос с JOIN на Clients
        return await query
            .OrderByDescending(c => c.ConclusionDate)
            .Select(c => new ContractDto
            {
                Id = c.Id,
                ContractNumber = c.ContractNumber,
                ClientId = c.ClientId,
                ClientName = c.Client.Name, // EF Core сам сделает JOIN!
                AdvanceRate = c.AdvanceRate,
                FactoringType = c.Type.ToString(),
                ConclusionDate = c.ConclusionDate,
                Status = c.Status.ToString()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ContractDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Contracts
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new ContractDto
            {
                Id = c.Id,
                ContractNumber = c.ContractNumber,
                ClientId = c.ClientId,
                ClientName = c.Client.Name,
                AdvanceRate = c.AdvanceRate,
                FactoringType = c.Type.ToString(),
                ConclusionDate = c.ConclusionDate,
                Status = c.Status.ToString()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<ContractDto> CreateAsync(CreateContractDto dto, CancellationToken cancellationToken = default)
    {
        // 1. Проверяем, существует ли такой клиент в БД (проверка Foreign Key!)
        var clientName = await _context.Clients
            .Where(c => c.Id == dto.ClientId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync(cancellationToken);

        if (clientName is null)
            throw new KeyNotFoundException($"Клиент с ID {dto.ClientId} не найден.");

        // 2. Проверяем уникальность номера договора
        var contractExists = await _context.Contracts
            .AnyAsync(c => c.ContractNumber == dto.ContractNumber.Trim(), cancellationToken);

        if (contractExists)
            throw new ConflictException($"Договор с номером {dto.ContractNumber} уже существует.");

        if (!Enum.TryParse<FactoringType>(dto.FactoringType, ignoreCase: true, out var parsedType))
            parsedType = FactoringType.WithRecourse;

        var contract = new Contract
        {
            ContractNumber = dto.ContractNumber.Trim(),
            ClientId = dto.ClientId,
            Type = parsedType,
            AdvanceRate = dto.AdvanceRate,
            ConclusionDate = DateTime.UtcNow, // Строго UTC!
            Status = ContractStatus.Active
        };

        await _context.Contracts.AddAsync(contract, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new ContractDto
        {
            Id = contract.Id,
            ContractNumber = contract.ContractNumber,
            ClientId = contract.ClientId,
            ClientName = clientName,
            AdvanceRate = contract.AdvanceRate,
            FactoringType = contract.Type.ToString(),
            ConclusionDate = contract.ConclusionDate,
            Status = contract.Status.ToString()
        };
    }
}