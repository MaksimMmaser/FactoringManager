using FactoringModule.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoringModule.Infrastructure.Persistence.Configurations;

public class RegistryConfiguration : IEntityTypeConfiguration<Registry>
{
    public void Configure(EntityTypeBuilder<Registry> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.RegistryNumber).IsRequired().HasMaxLength(50);
        builder.Property(r => r.TotalAmount).HasPrecision(18, 2);
        builder.Property(r => r.AdvanceAmount).HasPrecision(18, 2);
        builder.Property(r => r.CommissionAmount).HasPrecision(18, 2);

        builder.HasIndex(r => r.RegistryNumber).IsUnique();

        builder.HasOne(r => r.Contract)
            .WithMany(c => c.Registries)
            .HasForeignKey(r => r.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}