using FactoringModule.Domain.Entities;
using FactoringModule.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FactoringModule.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(FactoringDbContext context)
    {
        // Если в таблице Clients уже есть хотя бы одна запись — ничего не делаем (идемпотентность!)
        if (await context.Clients.AnyAsync())
            return;

        // 1. Клиенты (Поставщики ЦБУ №406 г. Пинск)
        var kuzlitmash = new Client
        {
            Name = "ОАО «Кузлитмаш»",
            Unp = "200024151",
            Iban = "BY88BLBB30120000241510001001",
            FactoringLimit = 55000.00m,
            UsedLimit = 13900.00m,
            Rating = ClientRating.A
        };

        var polesieClient = new Client
        {
            Name = "ОАО «Полесье» (Трикотаж)",
            Unp = "200000456",
            Iban = "BY44BLBB30120000004560001002",
            FactoringLimit = 40000.00m,
            UsedLimit = 12500.00m,
            Rating = ClientRating.B
        };

        var meatClient = new Client
        {
            Name = "ОАО «Пинский мясокомбинат»",
            Unp = "200000999",
            Iban = "BY12BLBB30120000009990001003",
            FactoringLimit = 25000.00m,
            UsedLimit = 1600.00m,
            Rating = ClientRating.C
        };

        await context.Clients.AddRangeAsync(kuzlitmash, polesieClient, meatClient);

        // 2. Дебиторы (Покупатели)
        var debtorPinskdrev = new Debtor
        {
            Name = "ЗАО «Холдинговая компания «Пинскдрев»",
            Unp = "200000123",
            SubLimit = 35000.00m,
            CurrentDebt = 24000.00m,
            OverdueDebt = 0m,
            AveragePaymentDays = 42,
            RiskCategory = DebtorRiskCategory.Reliable
        };

        var debtorPolesie = new Debtor
        {
            Name = "ОАО «Полесье» (Сеть магазинов)",
            Unp = "200000457",
            SubLimit = 20000.00m,
            CurrentDebt = 12500.00m,
            OverdueDebt = 0m,
            AveragePaymentDays = 28,
            RiskCategory = DebtorRiskCategory.Reliable
        };

        var debtorMeat = new Debtor
        {
            Name = "ОАО «Пинский мясокомбинат» (Торговый дом)",
            Unp = "200000998",
            SubLimit = 10000.00m,
            CurrentDebt = 1600.00m,
            OverdueDebt = 1600.00m, // Просрочен!
            AveragePaymentDays = 78,
            RiskCategory = DebtorRiskCategory.StopList
        };

        await context.Debtors.AddRangeAsync(debtorPinskdrev, debtorPolesie, debtorMeat);

        // 3. Договоры
        var contractKuz = new Contract
        {
            ContractNumber = "ФАКТ-2026/406",
            Type = FactoringType.WithRecourse,
            AdvanceRate = 0.80m,
            ConclusionDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            Status = ContractStatus.Active,
            Client = kuzlitmash
        };

        var contractPolesie = new Contract
        {
            ContractNumber = "ФАКТ-2026/407",
            Type = FactoringType.WithoutRecourse,
            AdvanceRate = 0.85m,
            ConclusionDate = new DateTime(2026, 2, 20, 0, 0, 0, DateTimeKind.Utc),
            Status = ContractStatus.Active,
            Client = polesieClient
        };

        await context.Contracts.AddRangeAsync(contractKuz, contractPolesie);

        // 4. Реестр и накладные
        var registry1 = new Registry
        {
            RegistryNumber = "РЕЕСТР-406/01",
            CreatedAt = new DateTime(2026, 11, 12, 10, 0, 0, DateTimeKind.Utc),
            TotalAmount = 32000.00m,
            AdvanceAmount = 25600.00m,
            CommissionAmount = 800.00m,
            Status = RegistryStatus.Financed,
            Contract = contractKuz
        };

        var inv1 = new Invoice
        {
            Number = "ТТН-004812",
            IssueDate = new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc),
            DueDate = new DateTime(2026, 12, 16, 0, 0, 0, DateTimeKind.Utc),
            Amount = 30000.00m,
            AdvanceAmount = 24000.00m,
            FeeAmount = 750.00m,
            Status = InvoiceStatus.Financed,
            Registry = registry1,
            Debtor = debtorPinskdrev
        };

        var inv2 = new Invoice
        {
            Number = "ТТН-004813",
            IssueDate = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc),
            DueDate = new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc), // Просрочена!
            Amount = 2000.00m,
            AdvanceAmount = 1600.00m,
            FeeAmount = 50.00m,
            Status = InvoiceStatus.Overdue,
            Registry = registry1,
            Debtor = debtorMeat
        };

        await context.Registries.AddAsync(registry1);
        await context.Invoices.AddRangeAsync(inv1, inv2);

        // Сохраняем всё одной транзакцией
        await context.SaveChangesAsync();
    }
}