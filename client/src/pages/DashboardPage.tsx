import React, { useState } from 'react';
import { KpiCards } from '../components/KpiCards';
import { ChartsSection } from '../components/ChartsSection';
import { OperationsTable } from '../components/OperationsTable';
import { CreateContractModal } from '../components/CreateContractModal';
import { UploadRegistryModal } from '../components/UploadRegistryModal';
import type { DashboardResponse } from '../api/factoringApi';
import type { ClientItem, FactoringContract, DebtorItem } from '../types/dashboard';

interface DashboardPageProps {
  dashboard: DashboardResponse;
  clients: ClientItem[];
  contracts: FactoringContract[];
  debtors: DebtorItem[];
  onAddContract: (contractData: any) => void;
  onAddRegistry: (registryData: any) => void;
  onRepayInvoice?: (invoiceId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  dashboard,
  clients,
  contracts,
  debtors,
  onAddContract,
  onAddRegistry,
  onRepayInvoice,
}) => {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Шапка дашборда */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Рабочий стол
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Мониторинг факторингового портфеля филиала ЦБУ №406 г. Пинск
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full self-start sm:self-auto">
          ● Подключено к PostgreSQL (.NET 10 API)
        </span>
      </div>

      {/* 1. Карточки KPI */}
      <KpiCards
        metrics={dashboard.metrics}
        onOpenCreateModal={() => setIsContractModalOpen(true)}
        onOpenUploadModal={() => setIsRegistryModalOpen(true)}
      />

      {/* 2. Графики портфеля и оборачиваемости */}
      <ChartsSection
        portfolioData={dashboard.portfolioData}
        turnoverData={dashboard.turnoverData}
      />

      {/* 3. Таблица последних операций с кнопкой погашения */}
      <OperationsTable 
        operations={dashboard.recentOperations} 
        onRepay={onRepayInvoice} 
      />

      {/* 4. Модалка создания договора (с реальными клиентами) */}
      <CreateContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        clients={clients}
        onCreate={onAddContract}
      />

      {/* 5. Модалка загрузки реестра (с реальными договорами и дебиторами) */}
      <UploadRegistryModal
        isOpen={isRegistryModalOpen}
        onClose={() => setIsRegistryModalOpen(false)}
        availableLimit={dashboard.metrics.availableLimit}
        contracts={contracts}
        debtors={debtors}
        onSuccess={onAddRegistry}
      />
    </div>
  );
};