using FactoringModule.Application.Interfaces;
using FactoringModule.Infrastructure.Persistence;
using FactoringModule.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<FactoringDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Регистрируем наш сервис в DI с временем жизни Scoped
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IDebtorService, DebtorService>();
builder.Services.AddScoped<IContractService, ContractService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    // Наполняем БД стартовыми данными через вручную созданный Scoped-блок
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<FactoringDbContext>();
        await DbInitializer.SeedAsync(dbContext);
    }

    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();