using FactoringModule.Application.DTOs.Debtors;
using FactoringModule.Application.Interfaces;
using FactoringModule.Domain.Entities;
using FactoringModule.Domain.Enums;
using FactoringModule.Infrastructure.Persistence;
using FactoringModule.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace FactoringModule.Infrastructure.Services;

public class DebtorService : IDebtorService
{
    private readonly FactoringDbContext _context;

    public DebtorService(FactoringDbContext context)
    {
        _context = context;
    }

    public async Task<List<DebtorDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Debtors
            .AsNoTracking()
            .OrderBy(d => d.Name)
            .Select(d => new DebtorDto
            {
                Id = d.Id,
                Name = d.Name,
                Unp = d.Unp,
                SubLimit = d.SubLimit,
                CurrentDebt = d.CurrentDebt,
                OverdueDebt = d.OverdueDebt,
                AveragePaymentDays = d.AveragePaymentDays,
                RiskCategory = d.RiskCategory.ToString()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<DebtorDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Debtors
            .AsNoTracking()
            .Where(d => d.Id == id)
            .Select(d => new DebtorDto
            {
                Id = d.Id,
                Name = d.Name,
                Unp = d.Unp,
                SubLimit = d.SubLimit,
                CurrentDebt = d.CurrentDebt,
                OverdueDebt = d.OverdueDebt,
                AveragePaymentDays = d.AveragePaymentDays,
                RiskCategory = d.RiskCategory.ToString()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<DebtorDto> CreateAsync(CreateDebtorDto dto, CancellationToken cancellationToken = default)
    {
        var exists = await _context.Debtors.AnyAsync(d => d.Unp == dto.Unp, cancellationToken);
        if (exists)
            throw new ConflictException($"Дебитор с УНП {dto.Unp} уже зарегистрирован в системе.");

        if (!Enum.TryParse<DebtorRiskCategory>(dto.RiskCategory, ignoreCase: true, out var parsedRisk))
            parsedRisk = DebtorRiskCategory.Reliable;

        var debtor = new Debtor
        {
            Name = dto.Name.Trim(),
            Unp = dto.Unp.Trim(),
            SubLimit = dto.SubLimit,
            CurrentDebt = 0m,
            OverdueDebt = 0m,
            AveragePaymentDays = dto.AveragePaymentDays,
            RiskCategory = parsedRisk
        };

        await _context.Debtors.AddAsync(debtor, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return new DebtorDto
        {
            Id = debtor.Id,
            Name = debtor.Name,
            Unp = debtor.Unp,
            SubLimit = debtor.SubLimit,
            CurrentDebt = debtor.CurrentDebt,
            OverdueDebt = debtor.OverdueDebt,
            AveragePaymentDays = debtor.AveragePaymentDays,
            RiskCategory = debtor.RiskCategory.ToString()
        };
    }
}