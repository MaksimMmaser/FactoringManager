namespace FactoringModule.Application.DTOs.Registries;

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public Guid DebtorId { get; set; }
    public string DebtorName { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ActualPaymentDate { get; set; }
    public decimal Amount { get; set; }
    public decimal AdvanceAmount { get; set; }
    public decimal FeeAmount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class RegistryDto
{
    public Guid Id { get; set; }
    public string RegistryNumber { get; set; } = string.Empty;
    public Guid ContractId { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AdvanceAmount { get; set; }
    public decimal CommissionAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<InvoiceDto> Invoices { get; set; } = new();
}