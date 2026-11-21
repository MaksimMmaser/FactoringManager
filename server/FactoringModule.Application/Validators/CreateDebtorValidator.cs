using FactoringModule.Application.DTOs.Debtors;
using FluentValidation;

namespace FactoringModule.Application.Validators;

public class CreateDebtorValidator : AbstractValidator<CreateDebtorDto>
{
    private static readonly string[] AllowedCategories = ["Reliable", "UnderControl", "StopList"];

    public CreateDebtorValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Наименование дебитора обязательно.")
            .Length(2, 200).WithMessage("Длина наименования от 2 до 200 символов.");

        RuleFor(x => x.Unp)
            .NotEmpty().WithMessage("УНП обязателен.")
            .Matches(@"^\d{9}$").WithMessage("УНП в РБ должен содержать ровно 9 цифр.");

        RuleFor(x => x.SubLimit)
            .GreaterThan(0).WithMessage("Сублимит должен быть больше 0 BYN.");

        RuleFor(x => x.AveragePaymentDays)
            .InclusiveBetween(1, 365).WithMessage("Срок отсрочки (DSO) должен быть от 1 до 365 дней.");

        RuleFor(x => x.RiskCategory)
            .Must(c => AllowedCategories.Contains(c, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Категория риска должна быть Reliable, UnderControl или StopList.");
    }
}