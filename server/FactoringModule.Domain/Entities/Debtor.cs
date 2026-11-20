using FactoringModule.Domain.Enums;
namespace FactoringModule.Domain.Entities;

public class Debtor
{
        public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Unp { get; set; } = string.Empty;
    public decimal SubLimit { get; set; }             // Кредитный сублимит на покупателя
    public decimal CurrentDebt { get; set; }          // Текущий долг перед банком
    public decimal OverdueDebt { get; set; }          // Просроченная часть долга
    public int AveragePaymentDays { get; set; }       // Оборачиваемость (DSO) в днях
    public DebtorRiskCategory RiskCategory { get; set; } = DebtorRiskCategory.Reliable;

    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}