import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Search, Filter, Check, ChevronDown, FileText } from 'lucide-react';
import { CreateContractModal } from '../components/CreateContractModal';
import type { FactoringContract } from '../types/dashboard';

interface ContractsPageProps {
  contracts: FactoringContract[];
  onAddContract: (contract: FactoringContract) => void;
}

type FilterType = 'ALL' | 'WithRecourse' | 'WithoutRecourse';

export const ContractsPage: React.FC<ContractsPageProps> = ({ contracts, onAddContract }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  // Закрытие меню фильтра при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фильтрация договоров по поиску и типу
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch = 
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = 
      typeFilter === 'ALL' || c.factoringType === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Шапка страницы: на мобилках flex-col, на ПК flex-row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Реестр генеральных договоров
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Действующие соглашения факторингового обслуживания юридических лиц
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-bank-600 hover:bg-bank-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-bank-600/20 transition-all active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Новый договор
        </button>
      </div>

      {/* 2. Панель поиска и фильтров */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        {/* Строка поиска */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Поиск по номеру или клиенту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* 🎯 Кастомное выпадающее меню фильтров по типу факторинга */}
        <div className="relative shrink-0" ref={filterRef}>
          <button 
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Тип: </span>
            <span>
              {typeFilter === 'ALL' && 'Все'}
              {typeFilter === 'WithRecourse' && 'С регрессом'}
              {typeFilter === 'WithoutRecourse' && 'Без регресса'}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180 text-bank-600' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              {[
                { id: 'ALL', label: 'Все договоры' },
                { id: 'WithRecourse', label: 'С регрессом' },
                { id: 'WithoutRecourse', label: 'Без регресса' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setTypeFilter(item.id as FilterType);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                    typeFilter === item.id 
                      ? 'bg-bank-50 text-bank-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                  {typeFilter === item.id && <Check className="w-3.5 h-3.5 text-bank-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Блок отображения данных */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Договоры не найдены
          </div>
        ) : (
          <>
            {/* 📱 МОБИЛЬНЫЙ ВИД: Карточки договоров (< md) БЕЗ СКРОЛЛА */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredContracts.map((contract) => (
                <div key={contract.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                  {/* Верхняя строка: Номер договора + Бейдж статуса */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-bank-50 flex items-center justify-center text-bank-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">
                        {contract.contractNumber}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                      Действует
                    </span>
                  </div>

                  {/* Название клиента */}
                  <div className="text-xs font-semibold text-slate-700 pl-9">
                    {contract.clientName}
                  </div>

                  {/* Нижняя плашка параметров: Тип, Аванс, Дата */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Вид</span>
                      <span className="font-semibold text-slate-600">
                        {contract.factoringType === 'WithRecourse' ? 'С регрессом' : 'Без регресса'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Аванс</span>
                      <span className="font-bold text-bank-600">
                        {Math.round(contract.advanceRate * 100)}%
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Дата</span>
                      <span className="text-slate-500 font-medium">
                        {contract.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 💻 ДЕСКТОПНЫЙ ВИД: Полноценная таблица (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 text-[11px] text-slate-400 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Номер договора</th>
                    <th className="py-3.5 px-6">Клиент (Поставщик)</th>
                    <th className="py-3.5 px-6">Тип факторинга</th>
                    <th className="py-3.5 px-6 text-center">Ставка аванса</th>
                    <th className="py-3.5 px-6">Дата заключения</th>
                    <th className="py-3.5 px-6 text-center">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">{contract.contractNumber}</td>
                      <td className="py-4 px-6 font-medium text-slate-700">{contract.clientName}</td>
                      <td className="py-4 px-6 text-xs font-semibold text-slate-500">
                        {contract.factoringType === 'WithRecourse' ? 'С регрессом' : 'Без регресса'}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-bank-600">
                        {Math.round(contract.advanceRate * 100)}%
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs">{contract.createdAt}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                          Действует
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

      {/* Попап создания нового договора */}
      <CreateContractModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onCreate={(contractData) => {
          onAddContract({
            ...contractData,
            status: 'Active',
          });
        }}
      />
    </div>
  );
};