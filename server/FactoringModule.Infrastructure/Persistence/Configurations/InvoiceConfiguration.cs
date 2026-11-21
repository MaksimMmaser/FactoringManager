using FactoringModule.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoringModule.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Number).IsRequired().HasMaxLength(50);
        builder.Property(i => i.Amount).HasPrecision(18, 2);
        builder.Property(i => i.AdvanceAmount).HasPrecision(18, 2);
        builder.Property(i => i.FeeAmount).HasPrecision(18, 2);

        // Индекс для быстрой фильтрации просроченных накладных по статусу и дате
        builder.HasIndex(i => new { i.Status, i.DueDate });

        builder.Ignore(i => i.IsOverdue);

        builder.HasOne(i => i.Registry)
            .WithMany(r => r.Invoices)
            .HasForeignKey(i => i.RegistryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Debtor)
            .WithMany(d => d.Invoices)
            .HasForeignKey(i => i.DebtorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}