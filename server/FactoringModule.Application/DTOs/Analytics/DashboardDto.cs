namespace FactoringModule.Application.DTOs.Analytics;

public class KpiMetricsDto
{
    public decimal TotalLimit { get; set; }
    public decimal UsedLimit { get; set; }
    public decimal AvailableLimit { get; set; }
    public decimal OverdueDebt { get; set; }
}

public class PortfolioPointDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class TurnoverPointDto
{
    public string Counterparty { get; set; } = string.Empty;
    public int Days { get; set; }
}

public class RecentOperationDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Counterparty { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class DashboardDto
{
    public KpiMetricsDto Metrics { get; set; } = new();
    public List<PortfolioPointDto> PortfolioData { get; set; } = new();
    public List<TurnoverPointDto> TurnoverData { get; set; } = new();
    public List<RecentOperationDto> RecentOperations { get; set; } = new();
}