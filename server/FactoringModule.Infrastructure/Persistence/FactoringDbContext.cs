using FactoringModule.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace FactoringModule.Infrastructure.Persistence;

public class FactoringDbContext: DbContext
{
    public FactoringDbContext(DbContextOptions<FactoringDbContext> options) : base(options)
    {
        
    }
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Debtor> Debtors => Set<Debtor>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Registry> Registries => Set<Registry>();
    public DbSet<Invoice> Invoices => Set<Invoice>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FactoringDbContext).Assembly);
    }
}