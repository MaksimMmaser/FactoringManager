using FactoringModule.Application.DTOs.Analytics;
using FactoringModule.Application.DTOs.Registries;
using FactoringModule.Application.Interfaces;
using FactoringModule.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoringModule.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private static readonly string[] MonthNames =
        ["", "Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

    private readonly FactoringDbContext _context;

    public AnalyticsService(FactoringDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        // 1. Агрегируем лимиты напрямую в SQL (SumAsync)
        var totalLimit = await _context.Clients.SumAsync(c => c.FactoringLimit, cancellationToken);
        var usedLimit = await _context.Clients.SumAsync(c => c.UsedLimit, cancellationToken);
        var overdueDebt = await _context.Debtors.SumAsync(d => d.OverdueDebt, cancellationToken);

        // 2. График оборачиваемости (DSO) из таблицы Дебиторов
        var turnoverData = await _context.Debtors
            .AsNoTracking()
            .OrderByDescending(d => d.CurrentDebt)
            .Take(6)
            .Select(d => new TurnoverPointDto
            {
                Counterparty = d.Name,
                Days = d.AveragePaymentDays
            })
            .ToListAsync(cancellationToken);

      // 3. Последние 10 операций (берем реальные реестры из PostgreSQL!)
          // 3. Последние операции (накладные ТТН с указанием цепочки Поставщик ➔ Покупатель)
           var recentOps = await _context.Invoices
               .AsNoTracking()
               .OrderByDescending(i => i.IssueDate)
               .Take(10)
               .Select(i => new RecentOperationDto
               {
                   Id = i.Id,
                   Date = i.IssueDate,
                   // 🎯 Пишем понятно: кто отгрузил ➔ кому отгрузил
                   Counterparty = i.Registry.Contract.Client.Name + " ➔ " + i.Debtor.Name,
                   Amount = i.AdvanceAmount,
                   Status = i.Status.ToString()
               })
               .ToListAsync(cancellationToken);

        // 4. Динамика портфеля по месяцам: сначала группировка в SQL, потом названия в C#!
        var monthlyRaw = await _context.Registries
            .AsNoTracking()
            .GroupBy(r => new { r.CreatedAt.Year, r.CreatedAt.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Amount = g.Sum(r => r.AdvanceAmount)
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToListAsync(cancellationToken);

        var portfolioData = monthlyRaw.Select(m => new PortfolioPointDto
        {
            Month = $"{MonthNames[m.Month]} {m.Year % 100}",
            Amount = Math.Round(m.Amount / 1000m, 2) // В тыс. BYN для графика
        }).ToList();

        return new DashboardDto
        {
            Metrics = new KpiMetricsDto
            {
                TotalLimit = totalLimit,
                UsedLimit = usedLimit,
                AvailableLimit = Math.Max(0, totalLimit - usedLimit),
                OverdueDebt = overdueDebt
            },
            TurnoverData = turnoverData,
            RecentOperations = recentOps,
            PortfolioData = portfolioData
        };
    }

    public async Task<ReconciliationReportDto> GetReconciliationReportAsync(
        Guid clientId,
        CancellationToken cancellationToken = default)
    {
        var client = await _context.Clients
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == clientId, cancellationToken);

        if (client is null)
            throw new KeyNotFoundException($"Клиент с ID {clientId} не найден.");

        // Вытаскиваем все накладные этого клиента через цепочку Invoice -> Registry -> Contract
        var invoices = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.Registry.Contract.ClientId == clientId)
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

        return new ReconciliationReportDto
        {
            ClientId = client.Id,
            ClientName = client.Name,
            ClientUnp = client.Unp,
            ClientIban = client.Iban,
            FactoringLimit = client.FactoringLimit,
            UsedLimit = client.UsedLimit,
            AvailableLimit = client.AvailableLimit,
            GeneratedAt = DateTime.UtcNow,
            TotalAmount = invoices.Sum(i => i.Amount),
            TotalAdvance = invoices.Sum(i => i.AdvanceAmount),
            TotalFee = invoices.Sum(i => i.FeeAmount),
            Invoices = invoices
        };
    }
}