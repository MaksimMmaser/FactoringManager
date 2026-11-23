import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import {
  Plus, Trash2, AlertTriangle, Calculator,
  CheckCircle2, ChevronDown, Check, Building2, FileText, Loader2, AlertCircle
} from 'lucide-react';
import type { FactoringContract, DebtorItem } from '../types/dashboard';

interface UploadRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableLimit: number;
  contracts: FactoringContract[];
  debtors: DebtorItem[];
  onSuccess: (registryData: any) => Promise<void> | void;
}

interface InvoiceFormRow {
  id: string;
  number: string;
  debtorId: string;
  amount: number;
  dueDate: string;
}

// Ставка аванса по умолчанию, если у договора нет корректной ставки
const DEFAULT_ADVANCE_RATE = 0.8;
const COMMISSION_RATE = 0.025;

const getDefaultDueDate = () =>
  new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

// Новая строка накладной. Номер ТТН уникальный, чтобы сервер не отклонял дубликаты
const createInvoiceRow = (debtorId: string, amount: number): InvoiceFormRow => ({
  id: crypto.randomUUID(),
  number: `ТТН-${Date.now().toString().slice(-7)}`,
  debtorId,
  amount,
  dueDate: getDefaultDueDate(),
});

// Дебитор по умолчанию: первый, которого нет в стоп-листе
const pickDefaultDebtor = (debtors: DebtorItem[]): DebtorItem | undefined =>
  debtors.find(d => d.riskCategory !== 'StopList') ?? debtors[0];

export const UploadRegistryModal: React.FC<UploadRegistryModalProps> = ({
  isOpen,
  onClose,
  availableLimit,
  contracts,
  debtors,
  onSuccess,
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);
  const contractDropdownRef = useRef<HTMLDivElement>(null);

  const [invoices, setInvoices] = useState<InvoiceFormRow[]>([]);
  const [activeDebtorRowId, setActiveDebtorRowId] = useState<string | null>(null);
  // Ссылка на обертку той строки, у которой сейчас открыт список дебиторов
  const debtorDropdownRef = useRef<HTMLDivElement>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Закрыли окно: очищаем форму. Открыли: убираем старую ошибку
  useEffect(() => {
    if (!isOpen) {
      setInvoices([]);
      setSelectedContractId('');
      setActiveDebtorRowId(null);
      setIsContractDropdownOpen(false);
    }
    setErrorMessage(null);
  }, [isOpen]);

  // Договор: выбираем первый, только если ничего не выбрано (или выбранного уже нет в списке)
  useEffect(() => {
    if (!isOpen) return;
    setSelectedContractId(prev =>
      prev && contracts.some(c => c.id.toLowerCase() === prev.toLowerCase())
        ? prev
        : (contracts[0]?.id ?? '')
    );
  }, [isOpen, contracts]);

  // Накладные: создаем первую строку, только если список пуст (выбор пользователя не затирается)
  useEffect(() => {
    if (!isOpen) return;
    const debtor = pickDefaultDebtor(debtors);
    if (!debtor) return;
    setInvoices(prev => (prev.length > 0 ? prev : [createInvoiceRow(debtor.id, 5000)]));
  }, [isOpen, debtors]);

  // Закрытие выпадающих списков по клику вне их области
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (contractDropdownRef.current && !contractDropdownRef.current.contains(target)) {
        setIsContractDropdownOpen(false);
      }

      // Список дебиторов закрываем, только если клик был ВНЕ открытой строки
      if (debtorDropdownRef.current && !debtorDropdownRef.current.contains(target)) {
        setActiveDebtorRowId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Безопасный поиск договора (без учета регистра)
  const selectedContract =
    contracts.find(c => c.id.toLowerCase() === selectedContractId?.toLowerCase()) || contracts[0];

  // Ставка аванса берется из выбранного договора
  const contractRate = selectedContract?.advanceRate;
  const advanceRate =
    contractRate != null && contractRate > 0 && contractRate <= 1
      ? contractRate
      : DEFAULT_ADVANCE_RATE;

  const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const advanceAmount = totalAmount * advanceRate;
  const commissionAmount = totalAmount * COMMISSION_RATE;
  const holdbackAmount = totalAmount - advanceAmount;
  const isLimitExceeded = advanceAmount > availableLimit;

  const handleAddInvoice = () => {
    const debtor = pickDefaultDebtor(debtors);
    if (!debtor) return;
    setInvoices(prev => [...prev, createInvoiceRow(debtor.id, 3000)]);
  };

  const handleRemoveInvoice = (id: string) => {
    if (invoices.length === 1) return;
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const handleUpdateInvoice = (id: string, field: keyof InvoiceFormRow, value: any) => {
    setInvoices(prev => prev.map(inv => (inv.id === id ? { ...inv, [field]: value } : inv)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isLimitExceeded || totalAmount <= 0 || !selectedContract) {
      setErrorMessage('Проверьте лимиты и корректность сумм в накладных.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess({
        contractId: selectedContract.id,
        invoices: invoices.map(i => ({
          number: i.number.trim(),
          debtorId: i.debtorId,
          amount: Number(i.amount),
          dueDate: i.dueDate,
        })),
      });

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Ошибка проведения реестра:', err);
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Ошибка проведения реестра на сервере.');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Передача реестра денежных требований (ТТН)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">Отказ банковского шлюза:</strong>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Выбор договора */}
        <div className="relative" ref={contractDropdownRef}>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Генеральный договор факторинга
          </label>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setIsContractDropdownOpen(!isContractDropdownOpen)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left transition-all focus:outline-none focus:ring-2 focus:ring-bank-500/25 min-h-[44px] disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5 truncate">
              <FileText className="w-4 h-4 text-bank-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                  {selectedContract ? `${selectedContract.contractNumber} • ${selectedContract.clientName}` : 'Нет доступных договоров'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Статус: {selectedContract?.status || '—'}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isContractDropdownOpen ? 'rotate-180 text-bank-600' : ''}`} />
          </button>

          {isContractDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1 animate-in fade-in max-h-56 overflow-y-auto">
              {contracts.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">Сначала создайте договор на вкладке «Реестр договоров»</div>
              ) : (
                contracts.map((c) => {
                  const isSelected = selectedContract?.id.toLowerCase() === c.id.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedContractId(c.id);
                        setIsContractDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                        isSelected ? 'bg-bank-50 text-bank-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <span className="block font-bold text-slate-800">{c.contractNumber} — {c.clientName}</span>
                        <span className="text-[10px] text-slate-400">Ставка аванса: {Math.round(c.advanceRate * 100)}%</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-bank-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Список накладных */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Накладные к финансированию ({invoices.length} шт.)
            </span>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAddInvoice}
              className="flex items-center gap-1.5 text-xs font-bold text-bank-600 hover:text-bank-700 bg-bank-50 hover:bg-bank-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить ТТН
            </button>
          </div>

          <div className="space-y-2.5">
            {invoices.map((inv, idx) => {
              // Безопасный поиск дебитора (без учета регистра)
              const currentDebtor = debtors.find(d => d.id.toLowerCase() === inv.debtorId?.toLowerCase());
              return (
                <div
                  key={inv.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">#{idx + 1}</span>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Номер ТТН"
                        value={inv.number}
                        onChange={(e) => handleUpdateInvoice(inv.id, 'number', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-none focus:border-bank-500 w-32 disabled:opacity-50"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="100"
                        step="100"
                        required
                        disabled={isSubmitting}
                        placeholder="Сумма"
                        value={inv.amount}
                        onChange={(e) => handleUpdateInvoice(inv.id, 'amount', Number(e.target.value))}
                        className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black font-mono text-right text-slate-900 focus:outline-none focus:border-bank-500 disabled:opacity-50"
                      />
                      <span className="text-[11px] font-bold text-slate-500">BYN</span>

                      <button
                        type="button"
                        disabled={invoices.length === 1 || isSubmitting}
                        onClick={() => handleRemoveInvoice(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Выбор дебитора: ref вешаем только на обертку открытой строки */}
                  <div
                    className="relative"
                    ref={activeDebtorRowId === inv.id ? debtorDropdownRef : null}
                  >
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        setActiveDebtorRowId(activeDebtorRowId === inv.id ? null : inv.id)
                      }
                      className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-left text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 min-h-[38px]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {currentDebtor ? currentDebtor.name : 'Выберите дебитора'}
                        </span>
                        {currentDebtor?.riskCategory === 'StopList' && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded shrink-0">
                            Стоп-лист
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {activeDebtorRowId === inv.id && (
                      <div
                        className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 p-1 space-y-0.5 animate-in fade-in duration-100 max-h-48 overflow-y-auto"
                      >
                        {debtors.map((deb) => {
                          const isSelected = inv.debtorId?.toLowerCase() === deb.id.toLowerCase();
                          return (
                            <button
                              key={deb.id}
                              type="button"
                              onClick={() => {
                                handleUpdateInvoice(inv.id, 'debtorId', deb.id);
                                setActiveDebtorRowId(null);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between ${
                                isSelected ? 'bg-bank-50 text-bank-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="font-medium">{deb.name}</span>
                                {deb.riskCategory === 'StopList' && (
                                  <span className="ml-1.5 text-[9px] text-rose-600 font-bold">● Стоп-лист</span>
                                )}
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-bank-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Калькулятор */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200">
            <Calculator className="w-4 h-4 text-bank-600" />
            Расчет аванса филиала ЦБУ №406
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Сумма требований:</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{formatMoney(totalAmount)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px] font-medium">
                Аванс к выдаче ({Math.round(advanceRate * 100)}%):
              </span>
              <span className="text-base font-black text-bank-600 font-mono">{formatMoney(advanceAmount)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">
                Дисконт банка ({(COMMISSION_RATE * 100).toFixed(1)}%):
              </span>
              <span className="font-semibold text-slate-700 font-mono">{formatMoney(commissionAmount)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px] font-medium">Гарантийный резерв:</span>
              <span className="font-semibold text-slate-700 font-mono">{formatMoney(holdbackAmount)}</span>
            </div>
          </div>
        </div>

        {isLimitExceeded ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Отказ: превышен кредитный лимит!</strong>
              Требуется аванс {formatMoney(advanceAmount)}, а свободно только {formatMoney(availableLimit)}.
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-bank-600 shrink-0" />
            <span>Лимит ЦБУ одобрен. Свободный остаток: {formatMoney(availableLimit - advanceAmount)}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLimitExceeded || totalAmount <= 0 || isSubmitting || !selectedContract}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-bank-600 hover:bg-bank-700 disabled:bg-slate-300 shadow-md shadow-bank-600/20 transition-all active:scale-95"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmitting ? 'Проведение...' : 'Выплатить аванс поставщику'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};