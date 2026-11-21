using FactoringModule.Application.DTOs.Clients;
using FluentValidation;

namespace FactoringModule.Application.Validators;

public class CreateClientValidator : AbstractValidator<CreateClientDto>
{
    private static readonly string[] AllowedRatings = ["A", "B", "C"];

    public CreateClientValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Наименование предприятия обязательно.")
            .Length(2, 200).WithMessage("Наименование должно быть от 2 до 200 символов.");

        RuleFor(x => x.Unp)
            .NotEmpty().WithMessage("УНП обязателен.")
            .Matches(@"^\d{9}$").WithMessage("УНП юридического лица в РБ должен содержать ровно 9 цифр.");

        RuleFor(x => x.Iban)
            .NotEmpty().WithMessage("Расчетный счет IBAN обязателен.")
            .Matches(@"^BY[A-Z0-9]{26}$").WithMessage("IBAN в РБ должен начинаться с BY и содержать 28 символов.");

        RuleFor(x => x.FactoringLimit)
            .GreaterThan(0).WithMessage("Лимит факторинга должен быть больше 0 BYN.")
            .LessThanOrEqualTo(10_000_000m).WithMessage("Превышен максимальный лимит филиала (10 млн BYN).");

        RuleFor(x => x.Rating)
            .Must(r => AllowedRatings.Contains(r, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Рейтинг должен быть A, B или C.");
    }
}