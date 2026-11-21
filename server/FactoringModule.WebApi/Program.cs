using FactoringModule.Application.Interfaces;
using FactoringModule.Application.Validators;
using FactoringModule.Infrastructure.Persistence;
using FactoringModule.Infrastructure.Services;
using FactoringModule.WebApi.Infrastructure;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<FactoringDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Регистрация всех FluentValidation-валидаторов из сборки Application
builder.Services.AddValidatorsFromAssemblyContaining<CreateClientValidator>();

// Стандартизированные ответы ProblemDetails + глобальный обработчик ошибок
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IDebtorService, DebtorService>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IRegistryService, RegistryService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

// Подключаем наш автоматический фильтр валидации ко всем контроллерам
builder.Services.AddControllers(options =>
{
    options.Filters.Add<FluentValidationActionFilter>();
});

builder.Services.AddOpenApi();

var app = builder.Build();

// Ставим перехватчик ошибок в самом начале конвейера!
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
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