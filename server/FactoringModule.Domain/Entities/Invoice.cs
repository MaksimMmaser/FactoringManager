using FactoringModule.Domain.Enums;

namespace FactoringModule.Domain.Entities;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Number { get; set; } = string.Empty; // ТТН-004812
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ActualPaymentDate { get; set; }

    public decimal Amount { get; set; }        // Сумма по ТТН
    public decimal AdvanceAmount { get; set; } // Рассчитанный аванс
    public decimal FeeAmount { get; set; }     // Дисконт банка по этой ТТН
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;

    // Вычисляемое свойство просрочки (не хранится в БД)
    public bool IsOverdue =>
        Status == InvoiceStatus.Financed && DateTime.UtcNow.Date > DueDate.Date;

    // Внешний ключ (FK) на Реестр
    public Guid RegistryId { get; set; }
    public Registry Registry { get; set; } = null!;

    // Внешний ключ (FK) на Дебитора
    public Guid DebtorId { get; set; }
    public Debtor Debtor { get; set; } = null!;
}