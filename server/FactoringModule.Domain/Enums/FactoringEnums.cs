namespace FactoringModule.Domain.Enums;

public enum ClientRating
{
    A = 1, // Высокая надежность
    B = 2, // Умеренный риск
    C = 3  // Особый контроль
}

public enum DebtorRiskCategory
{
    Reliable = 1,     // Надежный
    UnderControl = 2, // Под контролем
    StopList = 3      // Стоп-лист (финансирование запрещено)
}

public enum FactoringType
{
    WithRecourse = 1,   // С регрессом (риск на поставщике)
    WithoutRecourse = 2 // Без регресса (риск на банке)
}

public enum ContractStatus
{
    Active = 1,
    Suspended = 2,
    Closed = 3
}

public enum RegistryStatus
{
    UnderReview = 1,
    Financed = 2,
    Rejected = 3
}

public enum InvoiceStatus
{
    Pending = 1,  // На рассмотрении
    Financed = 2, // Профинансировано (выдан аванс)
    Paid = 3,     // Погашено дебитором
    Overdue = 4   // Просрочено
}