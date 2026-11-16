import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Search, Filter, Check, ChevronDown, Building2} from 'lucide-react';
import { CreateClientModal } from '../components/CreateClientModal';
import type { ClientItem } from '../types/dashboard';

interface ClientsPageProps {
  clients: ClientItem[];
  onAddClient: (client: ClientItem) => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ clients, onAddClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
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
  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.unp.includes(searchQuery);
    const matchesRating = ratingFilter === 'ALL' || c.rating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  // Бейдж рейтинга
  const renderRatingBadge = (rating: 'A' | 'B' | 'C') => {
    switch (rating) {
      case 'A':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black">Рейтинг A</span>;
      case 'B':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black">Рейтинг B</span>;
      case 'C':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-black">Рейтинг C</span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Шапка */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Справочник клиентов (Поставщиков)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Юридические лица филиала ЦБУ №406 с установленными лимитами финансирования
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-bank-600 hover:bg-bank-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-bank-600/20 transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Добавить клиента
        </button>
      </div>

      {/* 2. Поиск и фильтры */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по названию или УНП (9 цифр)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Меню фильтра рейтинга */}
        <div className="relative shrink-0" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Рейтинг: </span>
            <span>{ratingFilter === 'ALL' ? 'Все' : `Класс ${ratingFilter}`}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180 text-bank-600' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              {[
                { id: 'ALL', label: 'Все клиенты' },
                { id: 'A', label: 'Класс A (Надежный)' },
                { id: 'B', label: 'Класс B (Средний)' },
                { id: 'C', label: 'Класс C (Контроль)' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setRatingFilter(item.id as any);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                    ratingFilter === item.id
                      ? 'bg-bank-50 text-bank-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                  {ratingFilter === item.id && <Check className="w-3.5 h-3.5 text-bank-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Список клиентов (Table-to-Card) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Клиенты не найдены
          </div>
        ) : (
          <>
            {/* 📱 МОБИЛЬНЫЙ ВИД (< md) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredClients.map((client) => {
                const percentUsed = Math.min(100, Math.round((client.usedLimit / client.factoringLimit) * 100));
                return (
                  <div key={client.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-bank-50 flex items-center justify-center text-bank-600">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{client.name}</span>
                      </div>
                      {renderRatingBadge(client.rating)}
                    </div>

                    <div className="text-xs text-slate-500 font-mono pl-9">
                      УНП: <strong className="text-slate-800">{client.unp}</strong>
                    </div>

                    {/* Полоса утилизации лимита */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Использовано лимита:</span>
                        <span className="font-bold text-slate-800">{percentUsed}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentUsed > 80 ? 'bg-rose-500' : 'bg-bank-600'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Занято: {formatMoney(client.usedLimit)}</span>
                        <span>Всего: {formatMoney(client.factoringLimit)}</span>
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
                    <th className="py-3.5 px-6">Клиент</th>
                    <th className="py-3.5 px-6">УНП / Счет IBAN</th>
                    <th className="py-3.5 px-6 text-center">Рейтинг</th>
                    <th className="py-3.5 px-6 text-right">Лимит факторинга</th>
                    <th className="py-3.5 px-6">Использование лимита</th>
                    <th className="py-3.5 px-6 text-center">Договоров</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => {
                    const percentUsed = Math.min(100, Math.round((client.usedLimit / client.factoringLimit) * 100));
                    return (
                      <tr key={client.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">{client.name}</td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-mono">
                          <div>УНП: <span className="font-bold text-slate-800">{client.unp}</span></div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{client.iban}</div>
                        </td>
                        <td className="py-4 px-6 text-center">{renderRatingBadge(client.rating)}</td>
                        <td className="py-4 px-6 text-right font-black text-slate-900">
                          {formatMoney(client.factoringLimit)}
                        </td>
                        <td className="py-4 px-6 w-52">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-500">{formatMoney(client.usedLimit)}</span>
                              <span className={percentUsed > 80 ? 'text-rose-600' : 'text-bank-600'}>{percentUsed}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  percentUsed > 80 ? 'bg-rose-500' : 'bg-bank-600'
                                }`}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-600">
                            {client.activeContractsCount}
                          </span>
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

      {/* Попап заведения клиента */}
      <CreateClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddClient={onAddClient}
      />
    </div>
  );
};