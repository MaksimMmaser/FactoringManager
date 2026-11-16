import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Search, Filter, Check, ChevronDown, Building2, ShieldAlert, AlertTriangle, Clock } from 'lucide-react';
import { CreateDebtorModal } from '../components/CreateDebtorModal';
import type { DebtorItem, DebtorRiskCategory } from '../types/dashboard';

interface DebtorsPageProps {
  debtors: DebtorItem[];
  onAddDebtor: (debtor: DebtorItem) => void;
}

export const DebtorsPage: React.FC<DebtorsPageProps> = ({ debtors, onAddDebtor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DebtorRiskCategory>('ALL');
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

  // Фильтрация
  const filteredDebtors = debtors.filter((d) => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.unp.includes(searchQuery);
    const matchesCategory = categoryFilter === 'ALL' || d.riskCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Финансовая статистика по дебиторам
  const totalDebt = debtors.reduce((sum, d) => sum + d.currentDebt, 0);
  const totalOverdue = debtors.reduce((sum, d) => sum + d.overdueDebt, 0);
  const stopListCount = debtors.filter(d => d.riskCategory === 'StopList').length;

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  const renderBadge = (category: DebtorRiskCategory) => {
    switch (category) {
      case 'Reliable':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black">Надежный</span>;
      case 'UnderControl':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black">Под контролем</span>;
      case 'StopList':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-black">Стоп-лист</span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Шапка страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Реестр дебиторов (Покупателей)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Контроль платежной дисциплины, сроков оплаты (DSO) и кредитных сублимитов
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-bank-600 hover:bg-bank-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-bank-600/20 transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Добавить дебитора
        </button>
      </div>

      {/* 2. Сводные риск-показатели филиала */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Общий долг дебиторов</span>
            <span className="text-lg font-black text-slate-900">{formatMoney(totalDebt)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Просроченный долг</span>
            <span className="text-lg font-black text-rose-700">{formatMoney(totalOverdue)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">В стоп-листе банка</span>
            <span className="text-lg font-black text-slate-900">{stopListCount} предприятия</span>
          </div>
        </div>
      </div>

      {/* 3. Поиск и фильтры */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск дебитора по наименованию или УНП..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Меню фильтра категорий */}
        <div className="relative shrink-0" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Статус: </span>
            <span>
              {categoryFilter === 'ALL' && 'Все'}
              {categoryFilter === 'Reliable' && 'Надежные'}
              {categoryFilter === 'UnderControl' && 'Контроль'}
              {categoryFilter === 'StopList' && 'Стоп-лист'}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180 text-bank-600' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              {[
                { id: 'ALL', label: 'Все дебиторы' },
                { id: 'Reliable', label: 'Надежные' },
                { id: 'UnderControl', label: 'Под контролем' },
                { id: 'StopList', label: 'Стоп-лист' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCategoryFilter(item.id as any);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                    categoryFilter === item.id
                      ? 'bg-bank-50 text-bank-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                  {categoryFilter === item.id && <Check className="w-3.5 h-3.5 text-bank-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Отображение (Table-to-Card) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredDebtors.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Дебиторы не найдены
          </div>
        ) : (
          <>
            {/* 📱 МОБИЛЬНЫЙ ВИД (< md) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredDebtors.map((debtor) => {
                const percentUsed = Math.min(100, Math.round((debtor.currentDebt / debtor.subLimit) * 100));
                return (
                  <div key={debtor.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-bank-50 flex items-center justify-center text-bank-600">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{debtor.name}</span>
                      </div>
                      {renderBadge(debtor.riskCategory)}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pl-9">
                      <span>УНП: <strong className="text-slate-800">{debtor.unp}</strong></span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        DSO: {debtor.averagePaymentDays} дн.
                      </span>
                    </div>

                    {/* Полоса сублимита */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Занято из сублимита:</span>
                        <span className="font-bold text-slate-800">{percentUsed}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            debtor.riskCategory === 'StopList' || percentUsed > 80 ? 'bg-rose-500' : 'bg-bank-600'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Долг: {formatMoney(debtor.currentDebt)}</span>
                        <span>Сублимит: {formatMoney(debtor.subLimit)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 💻 ДЕСКТОПНЫЙ ВИД (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 text-[11px] text-slate-400 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Дебитор (Покупатель)</th>
                    <th className="py-3.5 px-6">УНП</th>
                    <th className="py-3.5 px-6 text-center">Срок оплаты (DSO)</th>
                    <th className="py-3.5 px-6 text-center">Статус риска</th>
                    <th className="py-3.5 px-6 text-right">Текущий долг</th>
                    <th className="py-3.5 px-6">Сублимит риска</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDebtors.map((debtor) => {
                    const percentUsed = Math.min(100, Math.round((debtor.currentDebt / debtor.subLimit) * 100));
                    return (
                      <tr key={debtor.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">{debtor.name}</td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-mono font-bold">{debtor.unp}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-700">
                            {debtor.averagePaymentDays} дней
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">{renderBadge(debtor.riskCategory)}</td>
                        <td className="py-4 px-6 text-right font-black text-slate-900">
                          {formatMoney(debtor.currentDebt)}
                          {debtor.overdueDebt > 0 && (
                            <span className="block text-[10px] text-rose-600 font-bold">
                              просрочка: {formatMoney(debtor.overdueDebt)}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 w-52">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-500">{formatMoney(debtor.subLimit)}</span>
                              <span className={percentUsed > 80 ? 'text-rose-600 font-bold' : 'text-bank-600 font-bold'}>
                                {percentUsed}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  debtor.riskCategory === 'StopList' || percentUsed > 80 ? 'bg-rose-500' : 'bg-bank-600'
                                }`}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Попап создания дебитора */}
      <CreateDebtorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddDebtor={onAddDebtor}
      />
    </div>
  );
};