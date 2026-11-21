using FactoringModule.Application.DTOs.Analytics;

namespace FactoringModule.Application.Interfaces;

public interface IAnalyticsService
{
    Task<DashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default);
    Task<ReconciliationReportDto> GetReconciliationReportAsync(Guid clientId, CancellationToken cancellationToken = default);
}