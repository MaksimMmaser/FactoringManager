using FactoringModule.Application.DTOs.Registries;
using FactoringModule.Application.Interfaces;
using FactoringModule.Domain.Entities;
using FactoringModule.Domain.Enums;
using FactoringModule.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoringModule.Infrastructure.Services;

public class InvoiceService : IInvoiceService
{
    private readonly FactoringDbContext _context;

    public InvoiceService(FactoringDbContext context)
    {
        _context = context;
    }

    public async Task<List<InvoiceDto>> GetAllAsync(string? status = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Invoices
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<InvoiceStatus>(status, ignoreCase: true, out var parsedStatus))
        {
            query = query.Where(i => i.Status == parsedStatus);
        }

        return await query
            .OrderByDescending(i => i.IssueDate)
            .Select(i => new InvoiceDto
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
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<InvoiceDto> RepayAsync(Guid invoiceId, CancellationToken cancellationToken = default)
    {
        // 1. Быстрая проверка метаданных без кэширования в ChangeTracker
        var invoiceInfo = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.Id == invoiceId)
            .Select(i => new
            {
                i.Id,
                i.Status,
                i.DebtorId,
                ClientId = i.Registry.Contract.ClientId
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (invoiceInfo is null)
            throw new KeyNotFoundException($"Накладная с ID {invoiceId} не найдена.");

        if (invoiceInfo.Status == InvoiceStatus.Paid)
            throw new InvalidOperationException("Эта накладная уже полностью погашена.");

        // 2. Открываем ACID-транзакцию
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        // 3. Строгий порядок блокировок: сначала Client, потом Debtor (защита от Deadlock!)
        Client? client;
        Debtor? debtor;

        if (_context.Database.IsNpgsql())
        {
            client = await _context.Clients
                .FromSqlInterpolated($@"SELECT * FROM ""Clients"" WHERE ""Id"" = {invoiceInfo.ClientId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            debtor = await _context.Debtors
                .FromSqlInterpolated($@"SELECT * FROM ""Debtors"" WHERE ""Id"" = {invoiceInfo.DebtorId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == invoiceInfo.ClientId, cancellationToken);
            debtor = await _context.Debtors.FirstOrDefaultAsync(d => d.Id == invoiceInfo.DebtorId, cancellationToken);
        }

        var invoice = await _context.Invoices
            .Include(i => i.Debtor)
            .FirstOrDefaultAsync(i => i.Id == invoiceId, cancellationToken);

        if (client is null || debtor is null || invoice is null)
            throw new KeyNotFoundException("Связанные сущности сделки не найдены.");

        // 4. Повторная проверка статуса уже ПОД БЛОКИРОВКОЙ
        if (invoice.Status == InvoiceStatus.Paid)
            throw new InvalidOperationException("Эта накладная уже полностью погашена.");

        var wasOverdue = invoice.Status == InvoiceStatus.Overdue;

        // 5. Обновляем все 3 таблицы атомарно!
        invoice.Status = InvoiceStatus.Paid;
        invoice.ActualPaymentDate = DateTime.UtcNow;

        // Освобождаем лимит клиента на сумму выданного аванса
        client.UsedLimit = Math.Max(0, client.UsedLimit - invoice.AdvanceAmount);

        // Списываем долг дебитора
        debtor.CurrentDebt = Math.Max(0, debtor.CurrentDebt - invoice.Amount);
        if (wasOverdue)
            debtor.OverdueDebt = Math.Max(0, debtor.OverdueDebt - invoice.AdvanceAmount);

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new InvoiceDto
        {
            Id = invoice.Id,
            Number = invoice.Number,
            DebtorId = invoice.DebtorId,
            DebtorName = debtor.Name,
            IssueDate = invoice.IssueDate,
            DueDate = invoice.DueDate,
            ActualPaymentDate = invoice.ActualPaymentDate,
            Amount = invoice.Amount,
            AdvanceAmount = invoice.AdvanceAmount,
            FeeAmount = invoice.FeeAmount,
            Status = invoice.Status.ToString()
        };
    }
}