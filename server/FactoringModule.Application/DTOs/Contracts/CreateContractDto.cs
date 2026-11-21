namespace FactoringModule.Application.DTOs.Contracts;

public class CreateContractDto
{
    public string ContractNumber { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public string FactoringType { get; set; } = "WithRecourse";
    public decimal AdvanceRate { get; set; } = 0.80m;
}