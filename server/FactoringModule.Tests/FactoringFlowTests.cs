using FactoringModule.Application.DTOs.Registries;
using FactoringModule.Domain.Entities;
using FactoringModule.Domain.Enums;
using FactoringModule.Infrastructure.Persistence;
using FactoringModule.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FactoringModule.Tests;

public class FactoringFlowTests
{
    // Вспомогательный метод создания изолированной чистой БД в памяти для каждого теста
    private static FactoringDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<FactoringDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new FactoringDbContext(options);
    }

    [Fact]
    public async Task CreateRegistry_WhenDebtorInStopList_ThrowsInvalidOperationException()
    {
        // Arrange
        await using var context = CreateInMemoryContext();

        var client = new Client { Name = "Кузлитмаш", Unp = "200024151", Iban = "BY...", FactoringLimit = 50000m };
        var contract = new Contract { ContractNumber = "ФАКТ-1", Client = client, AdvanceRate = 0.80m };
        var badDebtor = new Debtor
        {
            Name = "Проблемный покупатель",
            Unp = "200000999",
            SubLimit = 20000m,
            RiskCategory = DebtorRiskCategory.StopList // В черном списке!
        };

        await context.AddRangeAsync(client, contract, badDebtor);
        await context.SaveChangesAsync();

        var registryService = new RegistryService(context);
        var dto = new CreateRegistryDto
        {
            ContractId = contract.Id,
            Invoices = [new CreateInvoiceItemDto { Number = "ТТН-1", DebtorId = badDebtor.Id, IssueDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(30), Amount = 1000m }]
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => registryService.CreateAsync(dto));
        Assert.Contains("Стоп-листе", ex.Message);
    }

    [Fact]
    public async Task CreateRegistry_WhenClientLimitExceeded_ThrowsAndLeavesLimitUntouched()
    {
        // Arrange: свободно только 5 000 BYN
        await using var context = CreateInMemoryContext();

        var client = new Client { Name = "Кузлитмаш", Unp = "200024151", Iban = "BY...", FactoringLimit = 10000m, UsedLimit = 5000m };
        var contract = new Contract { ContractNumber = "ФАКТ-1", Client = client, AdvanceRate = 0.80m };
        var debtor = new Debtor { Name = "Пинскдрев", Unp = "200000123", SubLimit = 50000m, RiskCategory = DebtorRiskCategory.Reliable };

        await context.AddRangeAsync(client, contract, debtor);
        await context.SaveChangesAsync();

        var registryService = new RegistryService(context);
        // Просим 10 000 * 0.80 = 8 000 аванса, а свободно только 5 000!
        var dto = new CreateRegistryDto
        {
            ContractId = contract.Id,
            Invoices = [new CreateInvoiceItemDto { Number = "ТТН-2", DebtorId = debtor.Id, IssueDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(30), Amount = 10000m }]
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => registryService.CreateAsync(dto));

        // Убеждаемся, что лимит в БД не изменился
        var savedClient = await context.Clients.FirstAsync(c => c.Id == client.Id);
        Assert.Equal(5000m, savedClient.UsedLimit);
    }

    [Fact]
    public async Task FullMoneyCycle_CreateAndRepay_CalculatesFeesAndRestoresLimit()
    {
        // Arrange
        await using var context = CreateInMemoryContext();

        var client = new Client { Name = "Кузлитмаш", Unp = "200024151", Iban = "BY...", FactoringLimit = 50000m, UsedLimit = 0m };
        var contract = new Contract { ContractNumber = "ФАКТ-1", Client = client, AdvanceRate = 0.80m };
        var debtor = new Debtor { Name = "Пинскдрев", Unp = "200000123", SubLimit = 30000m, CurrentDebt = 0m, RiskCategory = DebtorRiskCategory.Reliable };

        await context.AddRangeAsync(client, contract, debtor);
        await context.SaveChangesAsync();

        var registryService = new RegistryService(context);
        var invoiceService = new InvoiceService(context);

        // Act 1: Финансируем ТТН на 10 000 BYN (аванс должен стать 8 000, комиссия 250)
        var createdRegistry = await registryService.CreateAsync(new CreateRegistryDto
        {
            ContractId = contract.Id,
            Invoices = [new CreateInvoiceItemDto { Number = "ТТН-100", DebtorId = debtor.Id, IssueDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(30), Amount = 10000m }]
        });

        // Assert 1: Проверяем расчет и списание лимитов
        Assert.Equal(8000m, createdRegistry.AdvanceAmount);
        Assert.Equal(250m, createdRegistry.CommissionAmount);
        Assert.Equal(8000m, (await context.Clients.FirstAsync()).UsedLimit);
        Assert.Equal(10000m, (await context.Debtors.FirstAsync()).CurrentDebt);

        // Act 2: Дебитор гасит накладную
        var invoiceId = createdRegistry.Invoices.First().Id;
        var repaid = await invoiceService.RepayAsync(invoiceId);

        // Assert 2: Статус Paid, дата оплаты заполнена, лимит и долг обнулились!
        Assert.Equal("Paid", repaid.Status);
        Assert.NotNull(repaid.ActualPaymentDate);
        Assert.Equal(0m, (await context.Clients.FirstAsync()).UsedLimit);
        Assert.Equal(0m, (await context.Debtors.FirstAsync()).CurrentDebt);

        // Assert 3: Повторное погашение той же накладной запрещено!
        await Assert.ThrowsAsync<InvalidOperationException>(() => invoiceService.RepayAsync(invoiceId));
    }
}