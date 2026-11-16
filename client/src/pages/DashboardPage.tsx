import React, { useState } from 'react';
import { KpiCards } from '../components/KpiCards';
import { ChartsSection } from '../components/ChartsSection';
import { OperationsTable } from '../components/OperationsTable';
import { CreateContractModal } from '../components/CreateContractModal';
import { UploadRegistryModal } from '../components/UploadRegistryModal';
import type { 
  KpiMetrics, 
  PortfolioPoint, 
  TurnoverPoint, 
  RecentOperation, 
  FactoringContract,
  FactoringRegistry 
} from '../types/dashboard';

interface DashboardPageProps {
  availableLimit: number;
  onAddContract: (contract: FactoringContract) => void;
  onAddRegistry: (registry: FactoringRegistry) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  availableLimit, 
  onAddContract, 
  onAddRegistry 
}) => {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);

  const metrics: KpiMetrics = {
    totalLimit: 55000,
    usedLimit: 55000 - availableLimit,
    availableLimit: availableLimit,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Рабочий стол</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Мониторинг факторингового портфеля филиала ЦБУ №406 г. Пинск
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
          ● Система активна (Local UI)
        </span>
      </div>

      <KpiCards 
        metrics={metrics} 
        onOpenCreateModal={() => setIsContractModalOpen(true)}
        onOpenUploadModal={() => setIsRegistryModalOpen(true)}
      />
      <ChartsSection portfolioData={portfolioData} turnoverData={turnoverData} />
      <OperationsTable operations={operations} />

      <CreateContractModal 
        isOpen={isContractModalOpen} 
        onClose={() => setIsContractModalOpen(false)}
        onCreate={(contractData) => {
          onAddContract({
            ...contractData,
            status: 'Active',
          });
        }}
      />

      <UploadRegistryModal
        isOpen={isRegistryModalOpen}
        onClose={() => setIsRegistryModalOpen(false)}
        availableLimit={availableLimit}
        onSuccess={onAddRegistry}
      />
    </div>
  );
};