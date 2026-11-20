using FactoringModule.Domain.Enums;

namespace FactoringModule.Domain.Entities;

public class Contract
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ContractNumber { get; set; } = string.Empty; // Например, ФАКТ-2026/406
    public FactoringType Type { get; set; } = FactoringType.WithRecourse;
    public decimal AdvanceRate { get; set; } = 0.80m;          // Ставка аванса (0.80 = 80%)
    public DateTime ConclusionDate { get; set; } = DateTime.UtcNow;
    public ContractStatus Status { get; set; } = ContractStatus.Active;

    // Внешний ключ (FK) на Клиента
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    // В рамках одного договора много реестров
    public ICollection<Registry> Registries { get; set; } = new List<Registry>();
}