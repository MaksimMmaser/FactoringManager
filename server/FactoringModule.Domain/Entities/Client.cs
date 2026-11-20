using FactoringModule.Domain.Enums;

namespace FactoringModule.Domain.Entities;

public class Client
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Unp { get; set; } = string.Empty;  // 9 цифр, уникальный индекс настроим в EF
    public string Iban { get; set; } = string.Empty; // Расчетный счет BY...
    public decimal FactoringLimit { get; set; }      // Утвержденный лимит
    public decimal UsedLimit { get; set; }           // Использовано сейчас
    public ClientRating Rating { get; set; } = ClientRating.A;

    // Вычисляемое свойство (не пишется в БД)
    public decimal AvailableLimit => Math.Max(0, FactoringLimit - UsedLimit);

    // Навигационное свойство: у одного клиента много договоров
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
}