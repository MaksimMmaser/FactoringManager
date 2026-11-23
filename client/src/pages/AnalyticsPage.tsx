import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  TrendingUp, ShieldAlert, Percent,
  AlertTriangle, DollarSign, CheckCircle2, Clock
} from 'lucide-react';
import type { DebtorItem, FactoringRegistry } from '../types/dashboard';

interface AnalyticsPageProps {
  debtors: DebtorItem[];
  registries: FactoringRegistry[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ debtors, registries }) => {
  // 100% реальные вычисления из данных PostgreSQL (debtors и registries)
  const analytics = useMemo(() => {
    const totalDebt = debtors.reduce((sum, d) => sum + d.currentDebt, 0);
    const baseOverdue = debtors.reduce((sum, d) => sum + d.overdueDebt, 0);
    const stopListCount = debtors.filter((d) => d.riskCategory === 'StopList').length;

    // 1. NPL Ratio (Доля просрочки) и порог НБ РБ (макс. 5.0%)
    const nplNumber = totalDebt > 0 ? (baseOverdue / totalDebt) * 100 : 0;
    const nplRatio = nplNumber.toFixed(1);
    const nplThresholdPercent = Math.min(100, Math.round((nplNumber / 5) * 100));

    // 2. Реальный доход филиала и объемы финансирования по реестрам из БД
    const totalBankFee = registries.reduce((sum, r) => sum + r.commissionAmount, 0);
    const totalAdvance = registries.reduce((sum, r) => sum + r.advanceAmount, 0);
    const totalVolume = registries.reduce((sum, r) => sum + r.totalAmount, 0);
    const effectiveFeeRate = totalVolume > 0 ? ((totalBankFee / totalVolume) * 100).toFixed(2) : '0.00';

    // 3. Реальный средневзвешенный DSO (срок оборачиваемости в днях)
    let weightedDso = 0;
    if (totalDebt > 0) {
      weightedDso = debtors.reduce((sum, d) => sum + d.averagePaymentDays * d.currentDebt, 0) / totalDebt;
    } else if (debtors.length > 0) {
      weightedDso = debtors.reduce((sum, d) => sum + d.averagePaymentDays, 0) / debtors.length;
    }

    // 4. Структура портфеля по классам риска (для Donut-графика)
    const reliableSum = debtors
      .filter((d) => d.riskCategory === 'Reliable')
      .reduce((s, d) => s + d.currentDebt, 0);
    const controlSum = debtors
      .filter((d) => d.riskCategory === 'UnderControl')
      .reduce((s, d) => s + d.currentDebt, 0);
    const stopListSum = debtors
      .filter((d) => d.riskCategory === 'StopList')
      .reduce((s, d) => s + d.currentDebt, 0);

    const riskData = [
      { name: 'Класс А (Надежные)', value: reliableSum, color: '#059669' },
      { name: 'Класс B (Контроль)', value: controlSum, color: '#f59e0b' },
      { name: 'Класс C (Стоп-лист)', value: stopListSum, color: '#e11d48' },
    ];

    const chartRiskData = riskData.filter((item) => item.value > 0);

    // 5. Реальный комиссионный доход по клиентам из таблицы Registries
    const revenueByClientMap = new Map<string, number>();
    for (const reg of registries) {
      const current = revenueByClientMap.get(reg.clientName) || 0;
      revenueByClientMap.set(reg.clientName, current + reg.commissionAmount);
    }

    const revenueData = Array.from(revenueByClientMap.entries())
      .map(([clientName, fee]) => ({
        client: clientName
          .replace(/^ОАО\s+|^ЗАО\s+|^ООО\s+/i, '')
          .replace(/[«»"]/g, ''),
        fullName: clientName,
        fee: Math.round(fee * 100) / 100,
      }))
      .sort((a, b) => b.fee - a.fee);

    return {
      totalDebt,
      baseOverdue,
      stopListCount,
      nplNumber,
      nplRatio,
      nplThresholdPercent,
      totalBankFee,
      totalAdvance,
      totalVolume,
      effectiveFeeRate,
      weightedDso: weightedDso.toFixed(1),
      riskData,
      chartRiskData,
      revenueData,
    };
  }, [debtors, registries]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Аналитический центр рисков и доходности
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Кредитное качество факторингового портфеля филиала ЦБУ №406 (PostgreSQL)
          </p>
        </div>

        <span className="self-start sm:self-auto px-3 py-1.5 bg-bank-50 border border-bank-200 text-bank-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0">
          <TrendingUp className="w-4 h-4 text-bank-600" />
          <span>Средний дисконт: {analytics.effectiveFeeRate}%</span>
        </span>
      </div>

      {/* 2. ПРОФЕССИОНАЛЬНАЯ BENTO-СЕТКА KPI (2 колонки на мобилке, 12-колоночный Bento на ПК) */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* HERO-КАРТОЧКА: Комиссионный доход ЦБУ */}
        <div className="col-span-2 lg:col-span-4 bg-gradient-to-br from-emerald-50/80 via-white to-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-bank-600 text-white flex items-center justify-center shadow-sm shadow-bank-600/20 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block leading-none">
                  Доход ЦБУ (Дисконт)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  По {registries.length} реестрам из БД
                </span>
              </div>
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-bank-600 font-mono tabular-nums tracking-tight">
            {formatMoney(analytics.totalBankFee)}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-emerald-100 text-[11px]">
            <div>
              <span className="text-slate-500 block">Всего уступлено</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatMoney(analytics.totalVolume)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Выдано авансов</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatMoney(analytics.totalAdvance)}
              </span>
            </div>
          </div>
        </div>

        {/* ПЛИТКА 2: NPL с индикатором порога НБ РБ (5%) */}
        <div className="col-span-1 lg:col-span-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              NPL Риск
            </span>
            <Percent className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums">
              {analytics.nplRatio}%
            </div>
            {/* Полоса приближения к лимиту НБ РБ (5%) */}
            <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  analytics.nplNumber > 5
                    ? 'bg-rose-500'
                    : analytics.nplNumber >= 3.5
                    ? 'bg-amber-500'
                    : 'bg-bank-600'
                }`}
                style={{ width: `${analytics.nplThresholdPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold">
            {analytics.nplNumber <= 5 ? (
              <span className="text-emerald-700 flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Норма НБ (&lt;5%)</span>
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1 truncate">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Выше нормы 5%!</span>
              </span>
            )}
          </div>
        </div>

        {/* ПЛИТКА 3: Средневзвешенный DSO */}
        <div className="col-span-1 lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Оборот DSO
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums leading-none">
              {analytics.weightedDso}
            </div>
            <span className="text-xs font-bold text-slate-400 mt-1 block">дней</span>
          </div>

          <span className="text-[11px] text-slate-500 font-medium truncate">
            По {debtors.length} дебиторам
          </span>
        </div>

        {/* ПЛИТКА 4: Просроченный портфель (компактный баннер на мобилке, полноценная карточка на ПК) */}
        <div
          className={`col-span-2 lg:col-span-3 p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-row lg:flex-col items-center lg:items-stretch justify-between gap-3 ${
            analytics.baseOverdue > 0
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 lg:justify-between">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 lg:order-2 ${
                analytics.baseOverdue > 0
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {analytics.baseOverdue > 0 ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div className="lg:order-1">
              <span
                className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider block ${
                  analytics.baseOverdue > 0 ? 'text-rose-700' : 'text-slate-600'
                }`}
              >
                Просрочка
              </span>
              <span className="text-[11px] text-slate-500 font-medium lg:hidden">
                В Стоп-листе: {analytics.stopListCount} предпр.
              </span>
            </div>
          </div>

          <div className="text-right lg:text-left">
            <div
              className={`text-xl sm:text-3xl font-black font-mono tabular-nums tracking-tight ${
                analytics.baseOverdue > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {formatMoney(analytics.baseOverdue)}
            </div>
          </div>

          <span
            className={`hidden lg:block text-xs font-medium pt-2 border-t ${
              analytics.baseOverdue > 0
                ? 'text-rose-600 border-rose-200/60'
                : 'text-emerald-600 border-slate-100'
            }`}
          >
            В Стоп-листе: {analytics.stopListCount} предпр.
          </span>
        </div>
      </div>

      {/* 3. Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Бублик: Качество портфеля */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Качество факторингового портфеля
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Концентрация задолженности по классам надежности дебиторов
            </p>
          </div>

          <div className="h-60 w-full relative flex items-center justify-center">
            {analytics.chartRiskData.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Нет активной задолженности в БД</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [formatMoney(Number(val) || 0), 'Объем требований']}
                    />
                    <Pie
                      data={analytics.chartRiskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.chartRiskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Портфель</span>
                  <span className="text-sm font-black text-slate-800 font-mono">{formatMoney(analytics.totalDebt)}</span>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-[11px]">
            {analytics.riskData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium truncate" title={`${item.name}: ${formatMoney(item.value)}`}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Столбчатый график: Реальный доход ЦБУ по клиентам */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                Доход филиала ЦБУ №406 (Дисконт)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Комиссионное вознаграждение банка в разрезе клиентов
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
              BYN
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {analytics.revenueData.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Нет проведенных реестров в БД</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="client" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [formatMoney(Number(val) || 0), 'Комиссия (Дисконт)']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                  />
                  <Bar dataKey="fee" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;