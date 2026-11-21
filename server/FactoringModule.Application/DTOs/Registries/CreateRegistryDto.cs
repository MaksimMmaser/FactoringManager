namespace FactoringModule.Application.DTOs.Registries;

public class CreateInvoiceItemDto
{
    public string Number { get; set; } = string.Empty;
    public Guid DebtorId { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal Amount { get; set; }
}

public class CreateRegistryDto
{
    public Guid ContractId { get; set; }
    public List<CreateInvoiceItemDto> Invoices { get; set; } = new();
}