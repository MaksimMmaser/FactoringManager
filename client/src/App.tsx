import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { OperationsTable } from './components/OperationsTable';
import type { KpiMetrics, PortfolioPoint, TurnoverPoint, RecentOperation } from './types/dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Моковые данные (на следующем шаге их отдаст бэкенд на C#)
  const metrics: KpiMetrics = {
    totalLimit: 55000,
    usedLimit: 13900,
    availableLimit: 41100,
    overdueDebt: 1600,
  };

  const portfolioData: PortfolioPoint[] = [
    { month: 'Янв', amount: 15 },
    { month: 'Фев', amount: 18 },
    { month: 'Мар', amount: 24 },
    { month: 'Апр', amount: 32 },
    { month: 'Май', amount: 38 },
    { month: 'Июн', amount: 48 },
  ];

  const turnoverData: TurnoverPoint[] = [
    { counterparty: 'Пинскдрев', days: 42 },
    { counterparty: 'Полесье', days: 28 },
    { counterparty: 'Кузлитмаш', days: 55 },
    { counterparty: 'Амкодор', days: 34 },
    { counterparty: 'Мясокомбинат', days: 21 },
  ];

  const operations: RecentOperation[] = [
    { id: '1', date: '12.11.2026', counterparty: 'ЗАО «Холдинговая компания «Пинскдрев»', amount: 24000, status: 'Financed' },
    { id: '2', date: '11.11.2026', counterparty: 'ОАО «Полесье» (Трикотаж)', amount: 12500, status: 'Pending' },
    { id: '3', date: '10.11.2026', counterparty: 'ОАО «Кузлитмаш»', amount: 8200, status: 'Paid' },
    { id: '4', date: '08.11.2026', counterparty: 'ОАО «Пинский мясокомбинат»', amount: 1600, status: 'Overdue' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Рабочий стол</h1>
              <p className="text-sm text-slate-500 mt-1">
                Мониторинг факторингового портфеля филиала ЦБУ №406 г. Пинск
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              ● Система активна (Local Dev)
            </span>
          </div>

          <KpiCards metrics={metrics} />
          <ChartsSection portfolioData={portfolioData} turnoverData={turnoverData} />
          <OperationsTable operations={operations} />
        </main>
      </div>
    </div>
  );
}