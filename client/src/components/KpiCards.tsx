import React from 'react';
import { PlusCircle, UploadCloud } from 'lucide-react';
import  type { KpiMetrics } from '../types/dashboard';

interface KpiCardsProps {
  metrics: KpiMetrics;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics }) => {
  const formatMoney = (val: number) => 
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Всего лимитов */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Всего лимитов</span>
        <div className="text-2xl font-black text-slate-900 my-2">{formatMoney(metrics.totalLimit)}</div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-slate-400 h-full w-full" />
        </div>
      </div>

      {/* 2. Использовано */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Использовано</span>
        <div className="text-2xl font-black text-slate-900 my-2">{formatMoney(metrics.usedLimit)}</div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-bank-600 h-full rounded-full transition-all duration-700" 
            style={{ width: `${(metrics.usedLimit / metrics.totalLimit) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. Свободно (наш расчет: 55000 - 13900 = 41100) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Свободно</span>
        <div className="text-2xl font-black text-bank-600 my-2">{formatMoney(metrics.availableLimit)}</div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-bank-500 h-full rounded-full transition-all duration-700" 
            style={{ width: `${(metrics.availableLimit / metrics.totalLimit) * 100}%` }}
          />
        </div>
      </div>

      {/* 4. Просроченная дебиторка (Alert/Warning) */}
      <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Просроченная дебиторка</span>
        <div className="text-2xl font-black text-rose-700 my-2">{formatMoney(metrics.overdueDebt)}</div>
        <span className="text-[11px] text-rose-500 font-medium leading-none">Лимиты приостановлены</span>
      </div>

      {/* 5. Быстрые действия */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Быстрые действия</span>
        <button className="w-full flex items-center justify-center gap-2 bg-bank-600 hover:bg-bank-700 text-white py-2 px-3 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98]">
          <PlusCircle className="w-4 h-4" /> Создать договор
        </button>
        <button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98]">
          <UploadCloud className="w-4 h-4" /> Загрузить реестр
        </button>
      </div>
    </div>
  );
};