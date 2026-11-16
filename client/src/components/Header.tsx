import React from 'react';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleMenu: () => void; // Функция открытия мобильного сайдбара
}

export const Header: React.FC<HeaderProps> = ({ onToggleMenu }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Левая часть: кнопка гамбургера + поиск */}
      <div className="flex items-center gap-3">
        {/* Кнопка-гамбургер (видна ТОЛЬКО на мобилке: lg:hidden) */}
        <button 
          onClick={onToggleMenu}
          className="p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
          title="Открыть меню"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Поисковая строка */}
        <div className="relative w-44 sm:w-72 md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Поиск по УНП, клиенту..." 
            className="w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Правая часть: Уведомления и Профиль */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            5
          </span>
        </button>

        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all hidden sm:flex">
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-0.5 sm:mx-1" />

        {/* Профиль сотрудника */}
        <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            ЦБУ
          </div>
          <div className="text-left text-xs hidden md:block">
            <p className="font-bold text-slate-800 leading-tight">ЦБУ №406 г. Пинск</p>
            <p className="text-[10px] text-slate-400 font-medium">Белинвестбанк</p>
          </div>
        </div>
      </div>
    </header>
  );
};