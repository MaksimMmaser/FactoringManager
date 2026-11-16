import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { 
  Plus, Trash2, AlertTriangle, Calculator, 
  CheckCircle2, ChevronDown, Check, Building2, FileText 
} from 'lucide-react';
import type { FactoringRegistry, InvoiceItem } from '../types/dashboard';

interface UploadRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableLimit: number;
  onSuccess: (newRegistry: FactoringRegistry) => void;
}

interface ContractOption {
  number: string;
  client: string;
  limit: string;
}

const CONTRACT_OPTIONS: ContractOption[] = [
  { number: 'ФАКТ-2026/406', client: 'ОАО «Кузлитмаш»', limit: '55 000 BYN' },
  { number: 'ФАКТ-2026/407', client: 'ОАО «Полесье»', limit: '40 000 BYN' },
];

const DEBTOR_OPTIONS = [
  'ЗАО «ХК «Пинскдрев»',
  'ОАО «Полесье»',
  'ОАО «Кузлитмаш»',
  'ОАО «Пинский мясокомбинат»',
];

export const UploadRegistryModal: React.FC<UploadRegistryModalProps> = ({
  isOpen,
  onClose,
  availableLimit,
  onSuccess,
}) => {
  const advanceRate = 0.80; // 80%
  const commissionRate = 0.025; // 2.5%

  // Кастомный выбор договора
  const [selectedContract, setSelectedContract] = useState<ContractOption>(CONTRACT_OPTIONS[0]);
  const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);
  const contractDropdownRef = useRef<HTMLDivElement>(null);

  // Накладные
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: '1',
      number: 'ТТН-009811',
      debtorName: 'ЗАО «ХК «Пинскдрев»',
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

  // Дропдаун дебитора для конкретной строки накладной
  const [activeDebtorRowId, setActiveDebtorRowId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contractDropdownRef.current && !contractDropdownRef.current.contains(e.target as Node)) {
        setIsContractDropdownOpen(false);
      }
      setActiveDebtorRowId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Расчеты на лету
  const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const advanceAmount = totalAmount * advanceRate;
  const commissionAmount = totalAmount * commissionRate;
  const holdbackAmount = totalAmount - advanceAmount;
  const isLimitExceeded = advanceAmount > availableLimit;

  const handleAddInvoice = () => {
    const newInvoice: InvoiceItem = {
      id: crypto.randomUUID(),
      number: `ТТН-0098${invoices.length + 13}`,
      debtorName: 'ЗАО «ХК «Пинскдрев»',
      amount: 5000,
      dueDate: '2026-12-31',
    };
    setInvoices(prev => [...prev, newInvoice]);
  };

  const handleRemoveInvoice = (id: string) => {
    if (invoices.length === 1) return;
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const handleUpdateInvoice = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, [field]: value } : inv));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitExceeded || totalAmount <= 0) return;

    const newRegistry: FactoringRegistry = {
      id: crypto.randomUUID(),
      registryNumber: `РЕЕСТР-406/${Math.floor(100 + Math.random() * 900)}`,
      contractNumber: selectedContract.number,
      clientName: selectedContract.client,
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
        {/* 🎯 1. КАСТОМНЫЙ ДРОПДАУН ВЫБОРА ДОГОВОРА */}
        <div className="relative" ref={contractDropdownRef}>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Генеральный договор факторинга
          </label>
          <button
            type="button"
            onClick={() => setIsContractDropdownOpen(!isContractDropdownOpen)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left transition-all focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500"
          >
            <div className="flex items-center gap-2.5 truncate">
              <FileText className="w-4 h-4 text-bank-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                  {selectedContract.number} • {selectedContract.client}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Лимит договора: {selectedContract.limit}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isContractDropdownOpen ? 'rotate-180 text-bank-600' : ''}`} />
          </button>

          {isContractDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {CONTRACT_OPTIONS.map((c) => {
                const isSelected = selectedContract.number === c.number;
                return (
                  <button
                    key={c.number}
                    type="button"
                    onClick={() => {
                      setSelectedContract(c);
                      setIsContractDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                      isSelected ? 'bg-bank-50 text-bank-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-slate-800">{c.number} — {c.client}</span>
                      <span className="text-[10px] text-slate-400">Лимит финансирования: {c.limit}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-bank-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 🎯 2. СТИЛЬНЫЙ СПИСОК НАКЛАДНЫХ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Накладные к финансированию ({invoices.length} шт.)
            </span>
            <button
              type="button"
              onClick={handleAddInvoice}
              className="flex items-center gap-1.5 text-xs font-bold text-bank-600 hover:text-bank-700 bg-bank-50 hover:bg-bank-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить ТТН
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {invoices.map((inv, idx) => (
              <div 
                key={inv.id} 
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors space-y-2 relative"
              >
                {/* Верхняя строка строки: Номер + Удалить */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">#{idx + 1}</span>
                    <input
                      type="text"
                      required
                      placeholder="Номер ТТН"
                      value={inv.number}
                      onChange={(e) => handleUpdateInvoice(inv.id, 'number', e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800 focus:outline-none focus:border-bank-500 w-32"
                    />
                  </div>

                  {/* Сумма накладной */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        step="100"
                        required
                        placeholder="Сумма"
                        value={inv.amount}
                        onChange={(e) => handleUpdateInvoice(inv.id, 'amount', Number(e.target.value))}
                        className="w-28 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black font-mono text-right text-slate-900 focus:outline-none focus:border-bank-500"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">BYN</span>

                    <button
                      type="button"
                      disabled={invoices.length === 1}
                      onClick={() => handleRemoveInvoice(inv.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors"
                      title="Удалить строку"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 🎯 КАСТОМНЫЙ ВЫБОР ДЕБИТОРА В СТРОКЕ (ВМЕСТО SELECT) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDebtorRowId(activeDebtorRowId === inv.id ? null : inv.id);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-left text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{inv.debtorName}</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  {activeDebtorRowId === inv.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-1 space-y-0.5 animate-in fade-in duration-100"
                    >
                      {DEBTOR_OPTIONS.map((deb) => (
                        <button
                          key={deb}
                          type="button"
                          onClick={() => {
                            handleUpdateInvoice(inv.id, 'debtorName', deb);
                            setActiveDebtorRowId(null);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                            inv.debtorName === deb ? 'bg-bank-50 text-bank-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>{deb}</span>
                          {inv.debtorName === deb && <Check className="w-3 h-3 text-bank-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🎯 3. СВЕТЛЫЙ КОРПОРАТИВНЫЙ БАНКОВСКИЙ КАЛЬКУЛЯТОР (НИКАКИХ ТЕМНЫХ ПЯТЕН!) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200">
            <Calculator className="w-4 h-4 text-bank-600" />
            Расчет выплаты филиала ЦБУ №406
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Сумма требований:</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{formatMoney(totalAmount)}</span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[11px] font-medium">Аванс к выдаче (80%):</span>
              <span className="text-base font-black text-bank-600 font-mono">{formatMoney(advanceAmount)}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Дисконт банка (2.5%):</span>
              <span className="font-semibold text-slate-700 font-mono">{formatMoney(commissionAmount)}</span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[11px] font-medium">Гарантийный резерв:</span>
              <span className="font-semibold text-slate-700 font-mono">{formatMoney(holdbackAmount)}</span>
            </div>
          </div>
        </div>

        {/* ВАЛИДАЦИЯ ЛИМИТОВ */}
        {isLimitExceeded ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Отказ кредитного контроля: лимит исчерпан!</strong>
              Требуется {formatMoney(advanceAmount)}, а свободно всего {formatMoney(availableLimit)}.
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-bank-600 shrink-0" />
            <span>Лимит ЦБУ одобрен. Свободный остаток: {formatMoney(availableLimit - advanceAmount)}</span>
          </div>
        )}

        {/* Кнопки */}
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