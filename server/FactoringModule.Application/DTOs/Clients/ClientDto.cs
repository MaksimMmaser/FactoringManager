namespace FactoringModule.Application.DTOs.Clients;

public class ClientDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unp { get; set; } = string.Empty;
    public string Iban { get; set; } = string.Empty;
    public decimal FactoringLimit { get; set; }
    public decimal UsedLimit { get; set; }
    public decimal AvailableLimit { get; set; }
    public string Rating { get; set; } = string.Empty; // "A", "B" или "C" — ровно как ждет наш React!
    public int ActiveContractsCount { get; set; }
}