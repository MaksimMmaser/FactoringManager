import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Menu, X, Building2, FileText, 
  Users, ChevronRight, LogIn 
} from 'lucide-react';
import type { ClientItem, FactoringContract, DebtorItem } from '../types/dashboard';

interface HeaderProps {
  onToggleMenu: () => void;
  clients: ClientItem[];
  contracts: FactoringContract[];
  debtors: DebtorItem[];
  currentUser: { name: string; role: string };
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMenu,
  clients,
  contracts,
  debtors,
  currentUser,
  onOpenAuth,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = searchQuery.toLowerCase().trim();

  const foundClients = q
    ? clients.filter(c => c.name.toLowerCase().includes(q) || c.unp.includes(q))
    : [];

  const foundContracts = q
    ? contracts.filter(c => c.contractNumber.toLowerCase().includes(q) || c.clientName.toLowerCase().includes(q))
    : [];

  const foundDebtors = q
    ? debtors.filter(d => d.name.toLowerCase().includes(q) || d.unp.includes(q))
    : [];

  const hasResults = foundClients.length > 0 || foundContracts.length > 0 || foundDebtors.length > 0;

  const handleSelectResult = (path: string) => {
    navigate(path);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    // 🎯 1. Добавили gap-2 sm:gap-4 — элементы больше НИКОГДА не врежутся друг в друга
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-8 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
      {/* Левая часть: Гамбургер + Поиск */}
      {/* 🎯 2. min-w-0 позволяет блоку сжиматься, shrink-0 на кнопке меню не дает её сплющить */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-lg">
        <button 
          onClick={onToggleMenu}
          className="p-1.5 sm:p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden transition-colors shrink-0"
          title="Открыть меню"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Поле поиска с гарантированным min-w-0 */}
        <div className="relative w-full min-w-0" ref={searchRef}>
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Поиск по УНП, клиенту..." 
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all placeholder:text-slate-400 truncate"
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Результаты поиска */}
          {isSearchOpen && searchQuery && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-40 max-h-80 sm:max-h-96 overflow-y-auto space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              {!hasResults ? (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  Ничего не найдено по запросу «{searchQuery}»
                </div>
              ) : (
                <>
                  {foundClients.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">
                        Клиенты (Поставщики)
                      </span>
                      {foundClients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectResult('/clients')}
                          className="w-full p-2 hover:bg-slate-50 rounded-xl text-left flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <Building2 className="w-4 h-4 text-bank-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-800 block truncate">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">УНП {c.unp}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {foundContracts.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">
                        Генеральные договоры
                      </span>
                      {foundContracts.map((con) => (
                        <button
                          key={con.id}
                          onClick={() => handleSelectResult('/contracts')}
                          className="w-full p-2 hover:bg-slate-50 rounded-xl text-left flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-800 block truncate">{con.contractNumber}</span>
                              <span className="text-[10px] text-slate-400 truncate block">{con.clientName}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {foundDebtors.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">
                        Дебиторы (Покупатели)
                      </span>
                      {foundDebtors.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => handleSelectResult('/debtors')}
                          className="w-full p-2 hover:bg-slate-50 rounded-xl text-left flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2">
                            <Users className="w-4 h-4 text-amber-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-800 block truncate">{d.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">УНП {d.unp}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🎯 3. shrink-0 гарантирует, что аватарка ЦБУ всегда сохранит свой размер и отступ */}
      <div className="flex items-center shrink-0">
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-3 sm:py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-left active:scale-95 shrink-0"
          title="Нажмите для смены пользователя / входа"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 shadow-xs">
            ЦБУ
          </div>
          <div className="hidden sm:block text-xs">
            <p className="font-bold text-slate-800 leading-tight flex items-center gap-1.5">
              <span>{currentUser.name}</span>
              <LogIn className="w-3 h-3 text-bank-600" />
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
              {currentUser.role}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};