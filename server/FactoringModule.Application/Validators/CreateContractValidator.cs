using FactoringModule.Application.DTOs.Contracts;
using FluentValidation;

namespace FactoringModule.Application.Validators;

public class CreateContractValidator : AbstractValidator<CreateContractDto>
{
    private static readonly string[] AllowedTypes = ["WithRecourse", "WithoutRecourse"];

    public CreateContractValidator()
    {
        RuleFor(x => x.ContractNumber)
            .NotEmpty().WithMessage("Номер договора обязателен.")
            .MaximumLength(50).WithMessage("Номер договора не должен превышать 50 символов.");

        RuleFor(x => x.ClientId)
            .NotEmpty().WithMessage("Не указан ID клиента.");

        RuleFor(x => x.AdvanceRate)
            .InclusiveBetween(0.10m, 0.95m)
            .WithMessage("Ставка авансирования должна быть в диапазоне от 0.10 (10%) до 0.95 (95%).");

        RuleFor(x => x.FactoringType)
            .Must(t => AllowedTypes.Contains(t, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Тип факторинга должен быть WithRecourse или WithoutRecourse.");
    }
}