using FactoringModule.Application.Interfaces;
using FactoringModule.Application.Validators;
using FactoringModule.Infrastructure.Persistence;
using FactoringModule.Infrastructure.Services;
using FactoringModule.WebApi.Infrastructure;
using FluentValidation;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;

// 1. Настраиваем Serilog до старта приложения, чтобы поймать даже ошибки запуска!
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("Запуск факторингового сервера ЦБУ №406 г. Пинск...");

    var builder = WebApplication.CreateBuilder(args);

    // Подключаем Serilog вместо стандартного логгера
    builder.Services.AddSerilog();

    // Настройка заголовков прокси/туннеля (Cloudflare Tunnel / ngrok)
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
    });

    // БД PostgreSQL
    builder.Services.AddDbContext<FactoringDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Health Check: проверяем сам API + соединение с БД
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<FactoringDbContext>("postgres");

    // CORS: разрешаем локальный Vite, Vercel и любые адреса из переменной CORS_ORIGINS
    var customOrigins = builder.Configuration["CORS_ORIGINS"]?
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [];

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("FrontendPolicy", policy =>
        {
            policy.SetIsOriginAllowed(origin =>
                {
                    if (string.IsNullOrWhiteSpace(origin)) return false;
                    var uri = new Uri(origin);
                    // Разрешаем localhost (для разработки), все поддомены vercel.app и явные адреса из конфига
                    return uri.Host == "localhost"
                        || uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)
                        || customOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
                })
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

    // Валидация + Глобальный обработчик ошибок ProblemDetails
    builder.Services.AddValidatorsFromAssemblyContaining<CreateClientValidator>();
    builder.Services.AddProblemDetails();
    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

    // Регистрация бизнес-сервисов
    builder.Services.AddScoped<IClientService, ClientService>();
    builder.Services.AddScoped<IDebtorService, DebtorService>();
    builder.Services.AddScoped<IContractService, ContractService>();
    builder.Services.AddScoped<IRegistryService, RegistryService>();
    builder.Services.AddScoped<IInvoiceService, InvoiceService>();
    builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

    builder.Services.AddControllers(options =>
    {
        options.Filters.Add<FluentValidationActionFilter>();
    });

    builder.Services.AddOpenApi();

    var app = builder.Build();

    // Важно: ForwardedHeaders и ExceptionHandler ставим в самом начале конвейера!
    app.UseForwardedHeaders();
    app.UseExceptionHandler();

    // Логирование каждого HTTP-запроса (метод, путь, статус, время в мс)
    app.UseSerilogRequestLogging();

    // Включаем CORS строго ДО MapControllers!
    app.UseCors("FrontendPolicy");

    // Автомиграция и Seed Data (удобно для развертывания на новом ПК одной командой)
    var autoMigrate = app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("AUTO_MIGRATE");
    if (autoMigrate)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<FactoringDbContext>();
        await dbContext.Database.MigrateAsync();
        await DbInitializer.SeedAsync(dbContext);
    }

    // Scalar UI доступен в Development или если задано ENABLE_OPENAPI=true
    if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("ENABLE_OPENAPI"))
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    // Отключаем HTTPS-редирект внутри Docker/туннеля (иначе будет конфликт TLS)
    var isRunningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";
    if (!isRunningInContainer)
    {
        app.UseHttpsRedirection();
    }

    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Сервер остановлен из-за критической ошибки старта");
}
finally
{
    Log.CloseAndFlush();
}