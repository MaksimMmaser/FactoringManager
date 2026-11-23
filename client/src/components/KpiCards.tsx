import React from 'react';
import { PlusCircle, UploadCloud, ShieldAlert, CheckCircle2, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { KpiMetrics } from '../types/dashboard';

interface KpiCardsProps {
  metrics: KpiMetrics;
  onOpenCreateModal?: () => void;
  onOpenUploadModal?: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  metrics,
  onOpenCreateModal,
  onOpenUploadModal,
}) => {
  const formatMoney = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  const usedPercent =
    metrics.totalLimit > 0
      ? Math.min(100, Math.round((metrics.usedLimit / metrics.totalLimit) * 100))
      : 0;

  const overduePercent =
    metrics.totalLimit > 0
      ? ((metrics.overdueDebt / metrics.totalLimit) * 100).toFixed(1)
      : '0.0';

  // Разбиваем занятый лимит на "В работе (в норме)" и "Просрочено"
  const activeWorkingLimit = Math.max(0, metrics.usedLimit - metrics.overdueDebt);

  const rawSlices = [
    { name: 'Свободно', value: Math.max(0, metrics.availableLimit), color: '#059669' },
    { name: 'В работе', value: activeWorkingLimit, color: '#0f172a' },
    { name: 'Просрочка', value: Math.max(0, metrics.overdueDebt), color: '#e11d48' },
  ].filter((s) => s.value > 0);

  const donutData =
    rawSlices.length > 0
      ? rawSlices
      : [{ name: 'Нет лимитов', value: 1, color: '#e2e8f0' }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. DONUT-ВИДЖЕТ СТРУКТУРЫ ЛИМИТОВ */}
      <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-bank-50 border border-bank-100 text-bank-600 flex items-center justify-center shrink-0">
              <PieIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Структура лимитов ЦБУ
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            Всего: {formatMoney(metrics.totalLimit)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Кольцевая диаграмма */}
          <div className="w-36 h-36 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                  formatter={(value: any) => [formatMoney(Number(value) || 0), 'Сумма']}
                />
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={64}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, idx) => (
                    <Cell key={`slice-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Центр бублика */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-slate-900 font-mono leading-none">
                {usedPercent}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                занято
              </span>
            </div>
          </div>

          {/* Легенда и точные цифры справа */}
          <div className="flex-1 w-full space-y-2.5">
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-bank-600 shrink-0" />
                <span className="font-semibold text-emerald-900">Свободно</span>
              </div>
              <span className="font-black text-bank-700 font-mono tabular-nums">
                {formatMoney(metrics.availableLimit)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0" />
                <span className="font-medium text-slate-600">В работе (норма)</span>
              </div>
              <span className="font-bold text-slate-900 font-mono tabular-nums">
                {formatMoney(activeWorkingLimit)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                <span className="font-medium text-slate-600">Просрочено</span>
              </div>
              <span className="font-bold text-rose-600 font-mono tabular-nums">
                {formatMoney(metrics.overdueDebt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ВИДЖЕТ РИСКА */}
      <div
        className={`lg:col-span-3 p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-3 ${
          metrics.overdueDebt > 0
            ? 'bg-gradient-to-br from-rose-50/90 to-white border-rose-200'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              metrics.overdueDebt > 0
                ? 'bg-rose-100 text-rose-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {metrics.overdueDebt > 0 ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <span
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold font-mono ${
              metrics.overdueDebt > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {overduePercent}% риска
          </span>
        </div>

        <div>
          <span
            className={`text-xs font-bold uppercase tracking-wider block ${
              metrics.overdueDebt > 0 ? 'text-rose-700' : 'text-slate-600'
            }`}
          >
            Просроченная дебиторка
          </span>
          <div
            className={`text-2xl font-black font-mono tabular-nums tracking-tight mt-1 ${
              metrics.overdueDebt > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {formatMoney(metrics.overdueDebt)}
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold pt-2 border-t ${
            metrics.overdueDebt > 0
              ? 'text-rose-600 border-rose-200/60'
              : 'text-emerald-600 border-slate-100'
          }`}
        >
          {metrics.overdueDebt > 0 ? 'Действует Стоп-лист' : 'Нарушений нет'}
        </span>
      </div>

      {/* 3. БЫСТРЫЕ ДЕЙСТВИЯ */}
      <div className="lg:col-span-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Быстрые действия
        </span>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 flex-1 justify-center">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-bank-600 hover:bg-bank-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-sm shadow-bank-600/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Создать договор</span>
          </button>

          <button
            type="button"
            onClick={onOpenUploadModal}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
          >
            <UploadCloud className="w-4 h-4 text-bank-600 shrink-0" />
            <span>Загрузить реестр</span>
          </button>
        </div>
      </div>
    </div>
  );
};