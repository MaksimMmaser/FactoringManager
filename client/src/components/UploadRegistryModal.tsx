import React, { useState } from 'react';
import { Modal } from './Modal';
import { Plus, Trash2, AlertTriangle, Calculator, CheckCircle2 } from 'lucide-react';
import type { FactoringRegistry, InvoiceItem } from '../types/dashboard';

interface UploadRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableLimit: number; // Доступный свободный лимит (41 100 BYN)
  onSuccess: (newRegistry: FactoringRegistry) => void;
}

export const UploadRegistryModal: React.FC<UploadRegistryModalProps> = ({
  isOpen,
  onClose,
  availableLimit,
  onSuccess,
}) => {
  // Выбранный договор
  const [selectedContract, setSelectedContract] = useState('ФАКТ-2026/406 (ОАО «Кузлитмаш»)');
  const advanceRate = 0.80; // Ставка авансирования 80%
  const commissionRate = 0.025; // Комиссия банка 2.5%

  // Динамический список накладных ТТН в реестре
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: '1',
      number: 'ТТН-009811',
      debtorName: 'ЗАО «Пинскдрев»',
      amount: 15000,
      dueDate: '2026-12-25',
    },
    {
      id: '2',
      number: 'ТТН-009812',
      debtorName: 'ОАО «Полесье»',
      amount: 10000,
      dueDate: '2026-12-30',
    },
  ]);

  // 🎯 РАСЧЕТЫ НА ЛЕТУ (Derived State без лишних useState!):
  const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const advanceAmount = totalAmount * advanceRate;
  const commissionAmount = totalAmount * commissionRate;
  const holdbackAmount = totalAmount - advanceAmount;

  // Проверка превышения лимита
  const isLimitExceeded = advanceAmount > availableLimit;

  // Добавление новой строки накладной
  const handleAddInvoice = () => {
    const newInvoice: InvoiceItem = {
      id: crypto.randomUUID(),
      number: `ТТН-0098${invoices.length + 13}`,
      debtorName: 'ЗАО «Пинскдрев»',
      amount: 5000,
      dueDate: '2026-12-31',
    };
    setInvoices(prev => [...prev, newInvoice]);
  };

  // Удаление строки накладной
  const handleRemoveInvoice = (id: string) => {
    if (invoices.length === 1) return; // Минимум одна накладная должна остаться
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  // Обновление поля конкретной накладной
  const handleUpdateInvoice = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return { ...inv, [field]: value };
      }
      return inv;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitExceeded || totalAmount <= 0) return;

    const newRegistry: FactoringRegistry = {
      id: crypto.randomUUID(),
      registryNumber: `РЕЕСТР-406/${Math.floor(100 + Math.random() * 900)}`,
      contractNumber: selectedContract.split(' ')[0],
      clientName: 'ОАО «Кузлитмаш»',
      createdAt: new Date().toLocaleDateString('ru-RU'),
      totalAmount,
      advanceAmount,
      commissionAmount,
      status: 'Financed',
      invoices,
    };

    onSuccess(newRegistry);
    onClose();
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Передача реестра денежных требований (ТТН)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Выбор генерального договора */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Генеральный договор факторинга
          </label>
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500"
          >
            <option value="ФАКТ-2026/406 (ОАО «Кузлитмаш»)">
              ФАКТ-2026/406 • ОАО «Кузлитмаш» (Лимит: 55 000 BYN)
            </option>
            <option value="ФАКТ-2026/407 (ОАО «Полесье»)">
              ФАКТ-2026/407 • ОАО «Полесье» (Лимит: 40 000 BYN)
            </option>
          </select>
        </div>

        {/* 2. Список накладных (ТТН) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Передаваемые накладные ({invoices.length} шт.)
            </span>
            <button
              type="button"
              onClick={handleAddInvoice}
              className="flex items-center gap-1.5 text-xs font-bold text-bank-600 hover:text-bank-700 bg-bank-50 hover:bg-bank-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить ТТН
            </button>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {invoices.map((inv, index) => (
              <div 
                key={inv.id} 
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                {/* Номер ТТН */}
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    required
                    placeholder="Номер ТТН"
                    value={inv.number}
                    onChange={(e) => handleUpdateInvoice(inv.id, 'number', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-bank-500"
                  />
                </div>

                {/* Дебитор */}
                <div className="sm:col-span-4">
                  <select
                    value={inv.debtorName}
                    onChange={(e) => handleUpdateInvoice(inv.id, 'debtorName', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="ЗАО «Пинскдрев»">ЗАО «Пинскдрев»</option>
                    <option value="ОАО «Полесье»">ОАО «Полесье»</option>
                    <option value="ОАО «Кузлитмаш»">ОАО «Кузлитмаш»</option>
                    <option value="ОАО «Пинский мясокомбинат»">Пинский мясокомбинат</option>
                  </select>
                </div>

                {/* Сумма */}
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    placeholder="Сумма BYN"
                    value={inv.amount}
                    onChange={(e) => handleUpdateInvoice(inv.id, 'amount', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-right text-slate-900 focus:outline-none focus:border-bank-500"
                  />
                </div>

                {/* Кнопка удаления */}
                <div className="sm:col-span-2 text-right">
                  <button
                    type="button"
                    disabled={invoices.length === 1}
                    onClick={() => handleRemoveInvoice(inv.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 🎯 БАНКОВСКИЙ КАЛЬКУЛЯТОР ФИНАНСИРОВАНИЯ */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            <Calculator className="w-4 h-4 text-bank-500" />
            Расчет выплаты филиала ЦБУ №406
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Общая сумма накладных:</span>
              <span className="text-base font-bold text-slate-200">{formatMoney(totalAmount)}</span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block">Аванс к выплате (80%):</span>
              <span className="text-base font-black text-bank-500">{formatMoney(advanceAmount)}</span>
            </div>

            <div>
              <span className="text-slate-400 block">Комиссия банка (2.5%):</span>
              <span className="font-semibold text-slate-300">{formatMoney(commissionAmount)}</span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block">Гарантийный остаток (20%):</span>
              <span className="font-semibold text-slate-300">{formatMoney(holdbackAmount)}</span>
            </div>
          </div>
        </div>

        {/* 4. ВАЛИДАЦИЯ ЛИМИТОВ: Предупреждение о кредитном риске */}
        {isLimitExceeded ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Отказ: Превышен свободный лимит факторинга!</strong>
              Требуется {formatMoney(advanceAmount)}, а свободно всего {formatMoney(availableLimit)}. Уменьшите сумму накладных.
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-bank-600 shrink-0" />
            Лимит одобрен. Свободно после операции: {formatMoney(availableLimit - advanceAmount)}
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLimitExceeded || totalAmount <= 0}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-bank-600 hover:bg-bank-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-bank-600/20 transition-all active:scale-95"
          >
            Выплатить аванс поставщику
          </button>
        </div>
      </form>
    </Modal>
  );
};