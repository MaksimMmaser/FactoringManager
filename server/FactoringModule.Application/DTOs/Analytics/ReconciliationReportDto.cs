using FactoringModule.Application.DTOs.Registries;

namespace FactoringModule.Application.DTOs.Analytics;

public class ReconciliationReportDto
{
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientUnp { get; set; } = string.Empty;
    public string ClientIban { get; set; } = string.Empty;
    public decimal FactoringLimit { get; set; }
    public decimal UsedLimit { get; set; }
    public decimal AvailableLimit { get; set; }
    public DateTime GeneratedAt { get; set; }

    public decimal TotalAmount { get; set; }
    public decimal TotalAdvance { get; set; }
    public decimal TotalFee { get; set; }

    public List<InvoiceDto> Invoices { get; set; } = new();
}