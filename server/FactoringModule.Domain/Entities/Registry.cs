using FactoringModule.Domain.Enums;

namespace FactoringModule.Domain.Entities;

public class Registry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RegistryNumber { get; set; } = string.Empty; // РЕЕСТР-406/01
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public decimal TotalAmount { get; set; }      // Общая сумма накладных
    public decimal AdvanceAmount { get; set; }    // Выплаченный банком аванс
    public decimal CommissionAmount { get; set; } // Дисконт (доход банка)
    public RegistryStatus Status { get; set; } = RegistryStatus.Financed;

    // Внешний ключ (FK) на Договор
    public Guid ContractId { get; set; }
    public Contract Contract { get; set; } = null!;

    // В одном реестре много накладных
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}