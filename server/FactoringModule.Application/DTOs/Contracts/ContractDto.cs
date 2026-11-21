namespace FactoringModule.Application.DTOs.Contracts;

public class ContractDto
{
    public Guid Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public decimal AdvanceRate { get; set; }
    public string FactoringType { get; set; } = string.Empty; // "WithRecourse" или "WithoutRecourse"
    public DateTime ConclusionDate { get; set; }
    public string Status { get; set; } = string.Empty;        // "Active", "Suspended", "Closed"
}