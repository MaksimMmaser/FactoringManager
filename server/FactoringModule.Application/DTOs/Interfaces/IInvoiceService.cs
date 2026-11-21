using FactoringModule.Application.DTOs.Registries;

namespace FactoringModule.Application.Interfaces;

public interface IInvoiceService
{
    Task<List<InvoiceDto>> GetAllAsync(string? status = null, CancellationToken cancellationToken = default);
    Task<InvoiceDto> RepayAsync(Guid invoiceId, CancellationToken cancellationToken = default);
}