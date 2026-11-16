import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, ShieldAlert, Percent, Sliders, 
  AlertTriangle, DollarSign, ArrowUpRight, CheckCircle2 
} from 'lucide-react';
import type { DebtorItem, FactoringRegistry } from '../types/dashboard';

interface AnalyticsPageProps {
  debtors: DebtorItem[];
  registries: FactoringRegistry[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ debtors, registries }) => {
  // Дни задержки в стресс-тесте
  const [stressDelayDays, setStressDelayDays] = useState(0);

  // Расчет показателей через useMemo
  const analytics = useMemo(() => {
    const totalDebt = debtors.reduce((sum, d) => sum + d.currentDebt, 0);
    const baseOverdue = debtors.reduce((sum, d) => sum + d.overdueDebt, 0);

    // Доля просрочки (NPL)
    const nplRatio = totalDebt > 0 ? ((baseOverdue / totalDebt) * 100).toFixed(1) : '0';

    // Доход ЦБУ
    const totalBankFee = registries.reduce((sum, r) => sum + r.commissionAmount, 0);

    // Стресс-тест расчеты
    const simulatedOverdue = Math.round(baseOverdue + (stressDelayDays * (totalDebt * 0.015)));
    const simulatedExtraIncome = Math.round(stressDelayDays * 45);

    // Доли кредитного качества
    const reliableSum = debtors.filter(d => d.riskCategory === 'Reliable').reduce((s, d) => s + d.currentDebt, 0);
    const controlSum = debtors.filter(d => d.riskCategory === 'UnderControl').reduce((s, d) => s + d.currentDebt, 0);
    const stopListSum = debtors.filter(d => d.riskCategory === 'StopList').reduce((s, d) => s + d.currentDebt, 0);

    const riskData = [
      { name: 'Класс А (Надежные)', value: reliableSum || 1, color: '#059669' },
      { name: 'Класс B (Контроль)', value: controlSum || 1, color: '#f59e0b' },
      { name: 'Класс C (Стоп-лист)', value: stopListSum || 1, color: '#e11d48' },
    ];

    return {
      totalDebt,
      baseOverdue,
      nplRatio,
      totalBankFee,
      simulatedOverdue,
      simulatedExtraIncome,
      riskData,
    };
  }, [debtors, registries, stressDelayDays]);

  const revenueData = [
    { month: 'Янв', fee: 1.2 },
    { month: 'Фев', fee: 1.8 },
    { month: 'Мар', fee: 2.4 },
    { month: 'Апр', fee: 3.1 },
    { month: 'Май', fee: 3.9 },
    { month: 'Июн', fee: 4.8 },
  ];

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Аналитический центр рисков и доходности
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Кредитное качество факторингового портфеля филиала ЦБУ №406
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-bank-50 border border-bank-200 text-bank-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <TrendingUp className="w-4 h-4 text-bank-600" />
            Рентабельность: 18.4% годовых
          </span>
        </div>
      </div>

      {/* 2. Четыре карточки KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* NPL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              NPL (Доля просрочки)
            </span>
            <Percent className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 my-2">
            {analytics.nplRatio}%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Норматив НБ РБ (&lt;5%) соблюден</span>
          </div>
        </div>

        {/* Доход */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Комиссионный доход ЦБУ
            </span>
            <DollarSign className="w-4 h-4 text-bank-600" />
          </div>
          <div className="text-2xl font-black text-bank-600 my-2">
            {formatMoney(analytics.totalBankFee)}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-bank-600" />
            <span>+24% прирост к прошлому кварталу</span>
          </div>
        </div>

        {/* DSO */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Средний срок оборота
            </span>
            <span className="text-xs font-bold text-slate-400">DSO</span>
          </div>
          <div className="text-2xl font-black text-slate-900 my-2">
            41.2 <span className="text-sm font-semibold text-slate-400">дней</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Средний срок погашения покупателями
          </span>
        </div>

        {/* Рисковый портфель */}
        <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Просроченный портфель
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 my-2">
            {formatMoney(analytics.baseOverdue)}
          </div>
          <span className="text-xs text-rose-500 font-medium">
            Лимиты приостановлены (Стоп-лист)
          </span>
        </div>
      </div>

      {/* 3. Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Бублик */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Качество факторингового портфеля
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Концентрация требований по классам надежности дебиторов
            </p>
          </div>

          <div className="h-60 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [formatMoney(val), 'Объем требований']}
                />
                <Pie
                  data={analytics.riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {analytics.riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Портфель</span>
              <span className="text-sm font-black text-slate-800">{formatMoney(analytics.totalDebt)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-[11px]">
            {analytics.riskData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Столбчатый график */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                Доход филиала ЦБУ №406 (Дисконт)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ежемесячное комиссионное вознаграждение банка
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
              тыс. BYN
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} тыс. BYN`, 'Доход банка']}
                />
                <Bar dataKey="fee" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 🎯 4. СТРЕСС-ТЕСТИРОВАНИЕ В СТРОГОМ БЕЛОМ БАНКОВСКОМ СТИЛЕ */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        {/* Шапка блока */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bank-50 text-bank-600 border border-bank-100 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">
                Моделирование стресс-теста ликвидности
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Оценка рисков кассовых разрывов при задержке расчетов покупателями г. Пинск
              </p>
            </div>
          </div>

          {/* Индикатор сценария */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 self-start sm:self-auto">
            <span className="text-slate-400">Сценарий:</span>
            <span className="text-bank-600 font-extrabold">+{stressDelayDays} дней задержки</span>
          </div>
        </div>

        {/* Ползунок с аккуратными метками */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={stressDelayDays}
            onChange={(e) => setStressDelayDays(Number(e.target.value))}
            className="w-full accent-bank-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-0.5">
            <span>0 дней (Базовый)</span>
            <span>+15 дней (Умеренный риск)</span>
            <span>+30 дней (Кризис)</span>
          </div>
        </div>

        {/* Карточки результатов: Белый стиль с мягкими акцентами */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* 1. Потенциальная просрочка */}
          <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
              Потенциальная просрочка
            </span>
            <span className="text-2xl font-black text-rose-700 my-2 block">
              {formatMoney(analytics.simulatedOverdue)}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">
              Потребует формирования резервов
            </span>
          </div>

          {/* 2. Штрафной доход */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Штрафной доход банка
            </span>
            <span className="text-2xl font-black text-bank-600 my-2 block">
              +{formatMoney(analytics.simulatedExtraIncome)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">
              Начисление пени (0.15% в день)
            </span>
          </div>

          {/* 3. Оценка риска */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              stressDelayDays === 0 
                ? 'bg-emerald-100 text-emerald-700' 
                : stressDelayDays <= 15 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-rose-100 text-rose-700'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <strong className="block font-bold text-slate-800 text-sm">
                {stressDelayDays === 0 
                  ? 'Риск минимален' 
                  : stressDelayDays <= 15 
                  ? 'Умеренный риск' 
                  : 'Критический риск!'}
              </strong>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                {stressDelayDays <= 15 
                  ? 'Филиал ЦБУ укладывается в нормативы ликвидности' 
                  : 'Рекомендуется заморозить лимиты на покупателей'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};