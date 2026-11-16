import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  ArrowLeftRight, 
  BarChart3, 
  FileSpreadsheet, 
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;        // Открыто ли мобильное меню
  onClose: () => void;    // Функция закрытия
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { to: '/', label: 'Рабочий стол', icon: LayoutDashboard },
    { to: '/contracts', label: 'Реестр договоров', icon: FileText },
    { to: '/clients', label: 'Клиенты', icon: Users },
    { to: '/debtors', label: 'Дебиторы', icon: Building2 },
    { to: '/operations', label: 'Операции', icon: ArrowLeftRight },
    { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
    { to: '/reports', label: 'Отчеты', icon: FileSpreadsheet },
    { to: '/settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <>
      {/* 1. Мобильная темная подложка (Backdrop) */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* 2. Сам Сайдбар */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 
        flex flex-col select-none transition-transform duration-300 ease-in-out
        ${/* На мобилке: если isOpen false — прячем за экран влево (-translate-x-full) */ ''}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${/* На ПК (lg): всегда статичен и виден на своем месте */ ''}
        lg:static lg:translate-x-0 lg:shrink-0 lg:min-h-screen
      `}>
        {/* Шапка логотипа */}
        <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
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

          {/* Кнопка закрытия (видна ТОЛЬКО на мобилке) */}
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Навигационные ссылки */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                // При клике на мобилке — закрываем шторку
                onClick={() => onClose()}
                className={({ isActive }: { isActive: boolean }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-bank-50 text-bank-700 shadow-sm border border-bank-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-bank-600' : 'text-slate-400'}`} />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Футер */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center font-medium">
          v1.0.0-rc • Белинвестбанк
        </div>
      </aside>
    </>
  );
};