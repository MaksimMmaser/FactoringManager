import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Поисковая строка с акцентом */}
      <div className="relative w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Поиск по УНП, клиенту или ТТН..." 
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Пользовательский блок ЦБУ Пинск */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            5
          </span>
        </button>

        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            ЦБУ
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-slate-800">ЦБУ №406 г. Пинск</p>
            <p className="text-slate-400 font-medium">ОАО «Белинвестбанк»</p>
          </div>
        </div>
      </div>
    </header>
  );
};