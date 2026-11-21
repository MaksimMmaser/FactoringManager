using FactoringModule.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoringModule.Infrastructure.Persistence.Configurations;

public class ContractConfiguration : IEntityTypeConfiguration<Contract>
{
    public void Configure(EntityTypeBuilder<Contract> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.ContractNumber).IsRequired().HasMaxLength(50);
        builder.Property(c => c.AdvanceRate).HasPrecision(5, 4); // Например: 0.8000

        builder.HasIndex(c => c.ContractNumber).IsUnique();

        // Связь 1:N с Клиентом + запрет каскадного удаления!
        builder.HasOne(c => c.Client)
            .WithMany(cl => cl.Contracts)
            .HasForeignKey(c => c.ClientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}