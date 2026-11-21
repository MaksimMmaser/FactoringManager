namespace FactoringModule.Application.DTOs.Debtors;

public class DebtorDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unp { get; set; } = string.Empty;
    public decimal SubLimit { get; set; }
    public decimal CurrentDebt { get; set; }
    public decimal OverdueDebt { get; set; }
    public int AveragePaymentDays { get; set; }
    public string RiskCategory { get; set; } = string.Empty; // "Reliable", "UnderControl", "StopList"
}