using FactoringModule.Application.DTOs.Registries;
using FactoringModule.Application.Interfaces;
using FactoringModule.Domain.Entities;
using FactoringModule.Domain.Enums;
using FactoringModule.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoringModule.Infrastructure.Services;

public class RegistryService : IRegistryService
{
    private const decimal CommissionRate = 0.025m; // Базовая ставка дисконта банка 2.5%
    private readonly FactoringDbContext _context;

    public RegistryService(FactoringDbContext context)
    {
        _context = context;
    }

    public async Task<List<RegistryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Registries
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RegistryDto
            {
                Id = r.Id,
                RegistryNumber = r.RegistryNumber,
                ContractId = r.ContractId,
                ContractNumber = r.Contract.ContractNumber,
                ClientName = r.Contract.Client.Name,
                CreatedAt = r.CreatedAt,
                TotalAmount = r.TotalAmount,
                AdvanceAmount = r.AdvanceAmount,
                CommissionAmount = r.CommissionAmount,
                Status = r.Status.ToString(),
                Invoices = r.Invoices.Select(i => new InvoiceDto
                {
                    Id = i.Id,
                    Number = i.Number,
                    DebtorId = i.DebtorId,
                    DebtorName = i.Debtor.Name,
                    IssueDate = i.IssueDate,
                    DueDate = i.DueDate,
                    ActualPaymentDate = i.ActualPaymentDate,
                    Amount = i.Amount,
                    AdvanceAmount = i.AdvanceAmount,
                    FeeAmount = i.FeeAmount,
                    Status = i.Status.ToString()
                }).ToList()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<RegistryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Registries
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(r => new RegistryDto
            {
                Id = r.Id,
                RegistryNumber = r.RegistryNumber,
                ContractId = r.ContractId,
                ContractNumber = r.Contract.ContractNumber,
                ClientName = r.Contract.Client.Name,
                CreatedAt = r.CreatedAt,
                TotalAmount = r.TotalAmount,
                AdvanceAmount = r.AdvanceAmount,
                CommissionAmount = r.CommissionAmount,
                Status = r.Status.ToString(),
                Invoices = r.Invoices.Select(i => new InvoiceDto
                {
                    Id = i.Id,
                    Number = i.Number,
                    DebtorId = i.DebtorId,
                    DebtorName = i.Debtor.Name,
                    IssueDate = i.IssueDate,
                    DueDate = i.DueDate,
                    ActualPaymentDate = i.ActualPaymentDate,
                    Amount = i.Amount,
                    AdvanceAmount = i.AdvanceAmount,
                    FeeAmount = i.FeeAmount,
                    Status = i.Status.ToString()
                }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<RegistryDto> CreateAsync(CreateRegistryDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.Invoices is null || dto.Invoices.Count == 0)
            throw new ArgumentException("Реестр должен содержать хотя бы одну накладную (ТТН).");

        // 1. Загружаем договор БЕЗ отслеживания и без включения Client (клиента заблокируем в транзакции!)
        var contract = await _context.Contracts
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == dto.ContractId, cancellationToken);

        if (contract is null)
            throw new KeyNotFoundException($"Договор с ID {dto.ContractId} не найден.");

        if (contract.Status != ContractStatus.Active)
            throw new InvalidOperationException($"Договор {contract.ContractNumber} не активен.");

        // 2. Открываем ACID-транзакцию ("всё или ничего")
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        // 3. Блокируем строку Клиента в PostgreSQL (SELECT ... FOR UPDATE) от Race Condition!
        Client? client;
        if (_context.Database.IsNpgsql())
        {
            client = await _context.Clients
                .FromSqlInterpolated($@"SELECT * FROM ""Clients"" WHERE ""Id"" = {contract.ClientId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            client = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == contract.ClientId, cancellationToken);
        }

        if (client is null)
            throw new KeyNotFoundException("Клиент по договору не найден.");

        // 4. Загружаем всех задействованных дебиторов ОДНИМ запросом (без N+1!)
        var debtorIds = dto.Invoices.Select(i => i.DebtorId).Distinct().ToList();
        var debtorsMap = await _context.Debtors
            .Where(d => debtorIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, cancellationToken);

        var registry = new Registry
        {
            RegistryNumber = $"РЕЕСТР-406/{DateTime.UtcNow:HHmmss}-{Random.Shared.Next(10, 99)}",
            ContractId = contract.Id,
            CreatedAt = DateTime.UtcNow,
            Status = RegistryStatus.Financed
        };

        decimal totalAmount = 0m;
        decimal totalAdvance = 0m;
        decimal totalCommission = 0m;

        // Накопитель долга по каждому дебитору (на случай нескольких ТТН на одного покупателя в одном реестре)
        var addedDebtPerDebtor = new Dictionary<Guid, decimal>();

        foreach (var item in dto.Invoices)
        {
            if (item.Amount <= 0)
                throw new ArgumentException($"Сумма накладной {item.Number} должна быть больше нуля.");

            if (!debtorsMap.TryGetValue(item.DebtorId, out var debtor))
                throw new KeyNotFoundException($"Дебитор с ID {item.DebtorId} не найден.");

            // Проверка Стоп-листа!
            if (debtor.RiskCategory == DebtorRiskCategory.StopList)
                throw new InvalidOperationException($"Отказ: дебитор «{debtor.Name}» находится в Стоп-листе банка!");

            // Проверка сублимита дебитора
            addedDebtPerDebtor.TryGetValue(debtor.Id, out var currentAdded);
            if (debtor.CurrentDebt + currentAdded + item.Amount > debtor.SubLimit)
            {
                throw new InvalidOperationException(
                    $"Превышен сублимит дебитора «{debtor.Name}» (Доступно: {debtor.SubLimit - debtor.CurrentDebt - currentAdded:N2} BYN).");
            }
            addedDebtPerDebtor[debtor.Id] = currentAdded + item.Amount;

            // Банковские расчеты строго на сервере!
            var advance = Math.Round(item.Amount * contract.AdvanceRate, 2, MidpointRounding.AwayFromZero);
            var fee = Math.Round(item.Amount * CommissionRate, 2, MidpointRounding.AwayFromZero);

            totalAmount += item.Amount;
            totalAdvance += advance;
            totalCommission += fee;

            registry.Invoices.Add(new Invoice
            {
                Number = item.Number.Trim(),
                DebtorId = debtor.Id,
                IssueDate = DateTime.SpecifyKind(item.IssueDate.ToUniversalTime(), DateTimeKind.Utc),
                DueDate = DateTime.SpecifyKind(item.DueDate.ToUniversalTime(), DateTimeKind.Utc),
                Amount = item.Amount,
                AdvanceAmount = advance,
                FeeAmount = fee,
                Status = InvoiceStatus.Financed
            });
        }

        // 5. Главная проверка свободного лимита клиента (уже под блокировкой FOR UPDATE!)
        if (totalAdvance > client.AvailableLimit)
        {
            throw new InvalidOperationException(
                $"Превышен свободный лимит клиента «{client.Name}»! Требуется аванс: {totalAdvance:N2} BYN, доступно: {client.AvailableLimit:N2} BYN.");
        }

        // 6. Обновляем баланс клиента и долги дебиторов
        registry.TotalAmount = totalAmount;
        registry.AdvanceAmount = totalAdvance;
        registry.CommissionAmount = totalCommission;

        client.UsedLimit += totalAdvance;
        foreach (var (debtorId, addedDebt) in addedDebtPerDebtor)
        {
            debtorsMap[debtorId].CurrentDebt += addedDebt;
        }

        await _context.Registries.AddAsync(registry, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 7. Фиксируем транзакцию (снимаем блокировку FOR UPDATE)
        await transaction.CommitAsync(cancellationToken);

        return (await GetByIdAsync(registry.Id, cancellationToken))!;
    }
}