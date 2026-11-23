import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Search, Filter, Check, ChevronDown, Layers, FileCheck, DollarSign } from 'lucide-react';
import { UploadRegistryModal } from '../components/UploadRegistryModal';
import type { FactoringRegistry, FactoringContract, DebtorItem } from '../types/dashboard';

interface OperationsPageProps {
  registries: FactoringRegistry[];
  contracts: FactoringContract[]; // 👈 Для выбора договора в модалке
  debtors: DebtorItem[];          // 👈 Для выбора дебиторов в накладных
  availableLimit: number;
  onAddRegistry: (registry: any) => void;
}

export const OperationsPage: React.FC<OperationsPageProps> = ({
  registries,
  contracts,
  debtors,
  availableLimit,
  onAddRegistry,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Financed' | 'UnderReview'>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRegistries = registries.filter((r) => {
    const matchesSearch = 
      r.registryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalVolume = registries.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalFinanced = registries.reduce((sum, r) => sum + r.advanceAmount, 0);
  const totalBankFee = registries.reduce((sum, r) => sum + r.commissionAmount, 0);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Журнал факторинговых операций
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Учет реестров денежных требований и расчет авансового финансирования
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-bank-600 hover:bg-bank-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-bank-600/20 transition-all active:scale-95 shrink-0"
        >
          <UploadCloud className="w-4 h-4" /> Загрузить реестр
        </button>
      </div>

      {/* Метрики дня */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Объем уступки</span>
            <span className="text-lg font-black text-slate-900">{formatMoney(totalVolume)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-bank-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Выплачено авансов</span>
            <span className="text-lg font-black text-bank-600">{formatMoney(totalFinanced)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Доход филиала (Комиссия)</span>
            <span className="text-lg font-black text-slate-900">{formatMoney(totalBankFee)}</span>
          </div>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по номеру реестра или клиенту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="relative shrink-0" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Статус: </span>
            <span>
              {statusFilter === 'ALL' && 'Все'}
              {statusFilter === 'Financed' && 'Профинансировано'}
              {statusFilter === 'UnderReview' && 'На проверке'}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180 text-bank-600' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              {[
                { id: 'ALL', label: 'Все реестры' },
                { id: 'Financed', label: 'Профинансировано' },
                { id: 'UnderReview', label: 'На проверке' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setStatusFilter(item.id as any);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                    statusFilter === item.id
                      ? 'bg-bank-50 text-bank-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                  {statusFilter === item.id && <Check className="w-3.5 h-3.5 text-bank-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Список реестров */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredRegistries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Реестры операций не найдены
          </div>
        ) : (
          <>
            {/* Мобильный вид */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredRegistries.map((reg) => (
                <div key={reg.id} className="p-4 space-y-2.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{reg.registryNumber}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                      Профинансировано
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-700">
                    {reg.clientName}
                    <span className="text-slate-400 block text-[10px] mt-0.5">
                      Договор: {reg.contractNumber} • Накладных: {reg.invoices.length} шт.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Сумма уступки</span>
                      <span className="font-bold text-slate-800">{formatMoney(reg.totalAmount)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Выплачен аванс (80%)</span>
                      <span className="font-black text-bank-600">{formatMoney(reg.advanceAmount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Десктопная таблица */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 text-[11px] text-slate-400 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Номер реестра</th>
                    <th className="py-3.5 px-6">Клиент (Поставщик)</th>
                    <th className="py-3.5 px-6 text-center">Кол-во ТТН</th>
                    <th className="py-3.5 px-6 text-right">Сумма требований</th>
                    <th className="py-3.5 px-6 text-right">Выплачено (Аванс)</th>
                    <th className="py-3.5 px-6 text-right">Комиссия</th>
                    <th className="py-3.5 px-6 text-center">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistries.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">{reg.registryNumber}</td>
                      <td className="py-4 px-6 font-medium text-slate-700">
                        {reg.clientName}
                        <span className="text-xs text-slate-400 block font-normal">{reg.contractNumber}</span>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-600">
                        <span className="px-2 py-1 bg-slate-100 rounded-md text-xs">{reg.invoices.length}</span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-900">{formatMoney(reg.totalAmount)}</td>
                      <td className="py-4 px-6 text-right font-black text-bank-600">{formatMoney(reg.advanceAmount)}</td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-500 text-xs">{formatMoney(reg.commissionAmount)}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                          Профинансировано
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Модалка с реальными договорами и дебиторами из БД */}
      <UploadRegistryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableLimit={availableLimit}
        contracts={contracts}
        debtors={debtors}
        onSuccess={onAddRegistry}
      />
    </div>
  );
};