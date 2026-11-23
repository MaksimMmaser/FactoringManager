import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { RecentOperation, OperationStatus } from '../types/dashboard';

interface OperationsTableProps {
  operations: RecentOperation[];
  onRepay?: (invoiceId: string) => void; // 👈 Добавили обработчик погашения
}

type FilterOption = 'ALL' | 'FINANCED' | 'PAID' | 'OVERDUE';

export const OperationsTable: React.FC<OperationsTableProps> = ({ operations, onRepay }) =>  {
  // Состояние кастомного выпадающего списка
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('ALL');

  // useRef для отслеживания клика вне выпадающего списка
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Список вариантов в меню фильтра
  const filterOptions: { id: FilterOption; label: string }[] = [
    { id: 'ALL', label: 'Все операции' },
    { id: 'FINANCED', label: 'Только выплаты аванса' },
    { id: 'PAID', label: 'Только погашенные' },
    { id: 'OVERDUE', label: 'Только просроченные' },
  ];

  // Хук useEffect для закрытия меню при клике в любое другое место экрана
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Реальная фильтрация операций в памяти
  const filteredOperations = operations.filter((op) => {
    if (selectedFilter === 'FINANCED') return op.status === 'Financed';
    if (selectedFilter === 'PAID') return op.status === 'Paid';
    if (selectedFilter === 'OVERDUE') return op.status === 'Overdue';
    return true; // 'ALL'
  });

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  // Бейджи статусов
  const renderBadge = (status: OperationStatus) => {
    switch (status) {
      case 'Financed':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold whitespace-nowrap">Профинансировано</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold whitespace-nowrap">На рассмотрении</span>;
      case 'Paid':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold whitespace-nowrap">Погашено</span>;
      case 'Overdue':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold whitespace-nowrap">Просрочено</span>;
    }
  };

  const currentFilterLabel = filterOptions.find(f => f.id === selectedFilter)?.label;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Шапка таблицы с кастомным Dropdown */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
            Последние операции
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Журнал проводок по уступке денежных требований
          </p>
        </div>

        {/* 🎯 НАШ КАСТОМНЫЙ БАНКОВСКИЙ ВЫПАДАЮЩИЙ СПИСОК */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-2.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-bank-500/20"
          >
            <span>{currentFilterLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-bank-600' : ''}`} />
          </button>

          {/* Всплывающее меню вариантов */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              {filterOptions.map((option) => {
                const isSelected = selectedFilter === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedFilter(option.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-bank-50 text-bank-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                    {isSelected && <Check className="w-3.5 h-3.5 text-bank-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 📱 1. МОБИЛЬНЫЙ ВИД: Карточки транзакций (< md) БЕЗ ГОРИЗОНТАЛЬНОГО СКРОЛЛА */}
      <div className="divide-y divide-slate-100 md:hidden">
        {filteredOperations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-medium">
            Нет операций по выбранному фильтру
          </div>
        ) : (
          filteredOperations.map((op) => (
            <div key={op.id} className="p-4 space-y-2.5 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-800 text-sm leading-snug">
                  {op.counterparty}
                </span>
                {renderBadge(op.status)}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400 font-medium">
                  {op.date}
                </span>
                <span className="text-base font-black text-slate-900 tracking-tight">
                  {formatMoney(op.amount)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 💻 2. ДЕСКТОПНЫЙ ВИД: Классическая просторная таблица (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/75 text-[11px] text-slate-400 uppercase font-bold border-b border-slate-100">
            <tr>
              <th className="py-3.5 px-6">Дата</th>
              <th className="py-3.5 px-6">Контрагент / Клиент</th>
              <th className="py-3.5 px-6 text-right">Сумма финансирования</th>
              <th className="py-3.5 px-6 text-center">Статус</th>
              <th className="py-3.5 px-6 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOperations.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-medium">
                  Нет операций по выбранному фильтру
                </td>
              </tr>
            ) : (
              filteredOperations.map((op) => (
                <tr key={op.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{op.date}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{op.counterparty}</td>
                  <td className="py-4 px-6 text-right font-extrabold text-slate-900 whitespace-nowrap">{formatMoney(op.amount)}</td>
                  <td className="py-4 px-6 text-center">{renderBadge(op.status)}</td>
                <td className="py-4 px-6 text-right">
                  {/* Если накладная еще не оплачена — показываем кнопку "Погасить" */}
                  {op.status !== 'Paid' && onRepay ? (
                    <button
                      type="button"
                      onClick={() => onRepay(op.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-bank-50 hover:text-bank-700 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      title="Дебитор перевел деньги в банк"
                    >
                      Погасить
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">—</span>
                  )}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};