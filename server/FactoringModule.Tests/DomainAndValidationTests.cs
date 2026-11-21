using FactoringModule.Application.DTOs.Clients;
using FactoringModule.Application.Validators;
using FactoringModule.Domain.Entities;
using FactoringModule.Domain.Enums;

namespace FactoringModule.Tests;

public class DomainAndValidationTests
{
    [Fact]
    public void Client_AvailableLimit_ShouldNeverBeNegative()
    {
        // Arrange
        var client = new Client
        {
            FactoringLimit = 10000m,
            UsedLimit = 15000m // Перерасход по старому долгу
        };

        // Act
        var available = client.AvailableLimit;

        // Assert
        Assert.Equal(0m, available);
    }

    [Fact]
    public void Invoice_IsOverdue_ShouldBeFalse_WhenAlreadyPaid()
    {
        // Arrange: срок оплаты истек 10 дней назад, но накладная уже оплачена!
        var invoice = new Invoice
        {
            Status = InvoiceStatus.Paid,
            DueDate = DateTime.UtcNow.AddDays(-10)
        };

        // Act & Assert
        Assert.False(invoice.IsOverdue);
    }

    [Theory]
    [InlineData("200024151", true)]   // Правильный белорусский УНП (9 цифр)
    [InlineData("123", false)]        // Слишком короткий
    [InlineData("20002415A", false)]  // Содержит букву
    [InlineData("", false)]           // Пустой
    public void CreateClientValidator_ShouldValidateUnpFormat(string unp, bool expectedIsValid)
    {
        // Arrange
        var validator = new CreateClientValidator();
        var dto = new CreateClientDto
        {
            Name = "ОАО «Тест»",
            Unp = unp,
            Iban = "BY88BLBB30120000241510001001",
            FactoringLimit = 50000m,
            Rating = "A"
        };

        // Act
        var result = validator.Validate(dto);

        // Assert
        Assert.Equal(expectedIsValid, result.IsValid);
    }
}