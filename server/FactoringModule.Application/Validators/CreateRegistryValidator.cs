using FactoringModule.Application.DTOs.Registries;
using FluentValidation;

namespace FactoringModule.Application.Validators;

public class CreateRegistryValidator : AbstractValidator<CreateRegistryDto>
{
    public CreateRegistryValidator()
    {
        RuleFor(x => x.ContractId)
            .NotEmpty().WithMessage("Необходимо указать договор (ContractId).");

        RuleFor(x => x.Invoices)
            .NotEmpty().WithMessage("Реестр должен содержать хотя бы одну накладную (ТТН).");

        // Валидируем КАЖДУЮ вложенную накладную!
        RuleForEach(x => x.Invoices).ChildRules(inv =>
        {
            inv.RuleFor(i => i.Number)
                .NotEmpty().WithMessage("Номер ТТН обязателен.")
                .MaximumLength(50).WithMessage("Номер ТТН слишком длинный.");

            inv.RuleFor(i => i.DebtorId)
                .NotEmpty().WithMessage("Не указан дебитор.");

            inv.RuleFor(i => i.Amount)
                .GreaterThan(0).WithMessage("Сумма накладной должна быть больше 0 BYN.");

            inv.RuleFor(i => i.DueDate)
                .GreaterThan(i => i.IssueDate)
                .WithMessage("Дата планового платежа (DueDate) должна быть позже даты отгрузки (IssueDate).");
        });
    }
}