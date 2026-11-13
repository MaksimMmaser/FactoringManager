import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  ArrowLeftRight, 
  BarChart3, 
  FileSpreadsheet, 
  Settings 
} from 'lucide-react';

// Props (входные параметры компонента) строго типизированы
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  // Список пунктов меню (данные отделены от отображения!)
  const menuItems = [
    { id: 'dashboard', label: 'Рабочий стол', icon: LayoutDashboard },
    { id: 'contracts', label: 'Реестр договоров', icon: FileText },
    { id: 'clients', label: 'Клиенты', icon: Users },
    { id: 'debtors', label: 'Дебиторы', icon: Building2 },
    { id: 'operations', label: 'Операции', icon: ArrowLeftRight },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'reports', label: 'Отчеты', icon: FileSpreadsheet },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen select-none">
      {/* 1. Блок Логотипа */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-bank-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-bank-600/20">
          🌱
        </div>
        <div>
          <span className="font-bold text-slate-800 text-lg leading-tight block tracking-tight">
            ФАКТОРИНГ
          </span>
          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
            ЦБУ 406 • Пинск
          </span>
        </div>
      </div>

      {/* 2. Навигационный список */}
      <nav className="p-4 space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-bank-50 text-bank-700 shadow-sm border border-bank-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-bank-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* 3. Футер сайдбара (версия модуля) */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center font-medium">
        v1.0.0-rc • Белинвестбанк
      </div>
    </aside>
  );
};