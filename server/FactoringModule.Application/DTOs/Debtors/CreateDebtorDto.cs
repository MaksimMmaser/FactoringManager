namespace FactoringModule.Application.DTOs.Debtors;

public class CreateDebtorDto
{
    public string Name { get; set; } = string.Empty;
    public string Unp { get; set; } = string.Empty;
    public decimal SubLimit { get; set; }
    public int AveragePaymentDays { get; set; } = 45;
    public string RiskCategory { get; set; } = "Reliable";
}