using FactoringModule.Domain.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace FactoringModule.WebApi.Infrastructure;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IProblemDetailsService _problemDetailsService;

    public GlobalExceptionHandler(
        ILogger<GlobalExceptionHandler> logger,
        IProblemDetailsService problemDetailsService)
    {
        _logger = logger;
        _problemDetailsService = problemDetailsService;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        ProblemDetails problemDetails;

        switch (exception)
        {
            case ValidationException validationEx:
                var errors = validationEx.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).Distinct().ToArray());

                problemDetails = new HttpValidationProblemDetails(errors)
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Ошибка валидации входных данных",
                    Detail = "Один или несколько параметров запроса не прошли проверку.",
                    Type = "https://tools.ietf.org/html/rfc9110#section-15.5.1"
                };
                break;

            case ArgumentException argEx:
                problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Некорректный запрос",
                    Detail = argEx.Message
                };
                break;

            case KeyNotFoundException notFoundEx:
                problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Ресурс не найден",
                    Detail = notFoundEx.Message
                };
                break;

            case ConflictException conflictEx:
                problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Конфликт данных",
                    Detail = conflictEx.Message
                };
                break;

            case InvalidOperationException businessEx:
                problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status422UnprocessableEntity,
                    Title = "Нарушение бизнес-правила банка",
                    Detail = businessEx.Message
                };
                break;

            default:
                // Непредвиденная ошибка 500: пишем полный StackTrace в лог сервера, но скрываем детали от клиента!
                _logger.LogError(exception, "Необработанное исключение. TraceId: {TraceId}", httpContext.TraceIdentifier);

                problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "Внутренняя ошибка сервера",
                    Detail = "Произошла непредвиденная ошибка. Обратитесь к администратору, указав traceId."
                };
                break;
        }

        httpContext.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;

        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = problemDetails
        });
    }
}