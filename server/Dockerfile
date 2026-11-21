# Этап 1: Лёгкий рантайм без компилятора (для финального контейнера)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
# В .NET 8/10 по соображениям безопасности запускаем от бесправного пользователя app
USER app

# Этап 2: Тяжелый SDK для сборки (исходники и компилятор останутся только здесь!)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Сначала копируем ТОЛЬКО .csproj и восстанавливаем NuGet-пакеты (кэширование слоев!)
COPY ["FactoringModule.Domain/FactoringModule.Domain.csproj", "FactoringModule.Domain/"]
COPY ["FactoringModule.Application/FactoringModule.Application.csproj", "FactoringModule.Application/"]
COPY ["FactoringModule.Infrastructure/FactoringModule.Infrastructure.csproj", "FactoringModule.Infrastructure/"]
COPY ["FactoringModule.WebApi/FactoringModule.WebApi.csproj", "FactoringModule.WebApi/"]
RUN dotnet restore "FactoringModule.WebApi/FactoringModule.WebApi.csproj"

# Затем копируем весь исходный код и публикуем Release-версию
COPY . .
RUN dotnet publish "FactoringModule.WebApi/FactoringModule.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Этап 3: Финальный чистый образ (переносим только скомпилированные DLL)
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "FactoringModule.WebApi.dll"]