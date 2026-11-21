using FactoringModule.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoringModule.Infrastructure.Persistence.Configurations;

public class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Unp).IsRequired().HasMaxLength(9);
        builder.Property(c => c.Iban).IsRequired().HasMaxLength(34);

        // Строгий денежный тип в PostgreSQL: numeric(18,2)
        builder.Property(c => c.FactoringLimit).HasPrecision(18, 2);
        builder.Property(c => c.UsedLimit).HasPrecision(18, 2);

        // Уникальный индекс по УНП (быстрый поиск + запрет дублей)
        builder.HasIndex(c => c.Unp).IsUnique();

        // Явно игнорируем вычисляемое свойство (не пишем в БД)
        builder.Ignore(c => c.AvailableLimit);
    }
}