namespace FactoringModule.Application.DTOs.Clients;

public class CreateClientDto
{
    public string Name { get; set; } = string.Empty;
    public string Unp { get; set; } = string.Empty;
    public string Iban { get; set; } = string.Empty;
    public decimal FactoringLimit { get; set; }
    public string Rating { get; set; } = "A";
}