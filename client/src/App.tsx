import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { DashboardPage } from './pages/DashboardPage';
import { ContractsPage } from './pages/ContractsPage';
import { OperationsPage } from './pages/OperationsPage';
import { ClientsPage } from './pages/ClientsPage';
import { DebtorsPage } from './pages/DebtorsPage';
import {AnalyticsPage} from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import type { 
  FactoringContract, 
  FactoringRegistry, 
  ClientItem, 
  DebtorItem 
} from './types/dashboard';

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Пользователь банковской системы
  const [currentUser, setCurrentUser] = useState({
    name: 'Козема Е. В.',
    role: 'Специалист по факторингу (ЦБУ №406)',
    login: 'officer-406',
  });

  // Свободный лимит ЦБУ (начинаем с 41 100 BYN)
  const [availableLimit, setAvailableLimit] = useState(41100);

  // 1. БАЗА ДОГОВОРОВ
  const [contracts, setContracts] = useState<FactoringContract[]>([
    {
      id: '1',
      contractNumber: 'ФАКТ-2026/406',
      clientName: 'ОАО «Кузлитмаш»',
      advanceRate: 0.80,
      factoringType: 'WithRecourse',
      createdAt: '15.01.2026',
      status: 'Active',
    },
    {
      id: '2',
      contractNumber: 'ФАКТ-2026/407',
      clientName: 'ОАО «Полесье»',
      advanceRate: 0.85,
      factoringType: 'WithoutRecourse',
      createdAt: '20.02.2026',
      status: 'Active',
    }
  ]);

  // 2. БАЗА КЛИЕНТОВ (ПОСТАВЩИКОВ)
  const [clients, setClients] = useState<ClientItem[]>([
    {
      id: '1',
      name: 'ОАО «Кузлитмаш»',
      unp: '200024151',
      iban: 'BY88BLBB30120000241510001001',
      factoringLimit: 55000,
      usedLimit: 13900,
      rating: 'A',
      activeContractsCount: 1,
    },
    {
      id: '2',
      name: 'ОАО «Полесье» (Трикотаж)',
      unp: '200000456',
      iban: 'BY44BLBB30120000004560001002',
      factoringLimit: 40000,
      usedLimit: 12500,
      rating: 'B',
      activeContractsCount: 1,
    },
    {
      id: '3',
      name: 'ОАО «Пинский мясокомбинат»',
      unp: '200000999',
      iban: 'BY12BLBB30120000009990001003',
      factoringLimit: 25000,
      usedLimit: 1600,
      rating: 'C',
      activeContractsCount: 1,
    }
  ]);

  // 3. БАЗА ДЕБИТОРОВ (ПОКУПАТЕЛЕЙ)
  const [debtors, setDebtors] = useState<DebtorItem[]>([
    {
      id: '1',
      name: 'ЗАО «Холдинговая компания «Пинскдрев»',
      unp: '200000123',
      subLimit: 35000,
      currentDebt: 24000,
      averagePaymentDays: 42,
      riskCategory: 'Reliable',
      overdueDebt: 0,
    },
    {
      id: '2',
      name: 'ОАО «Полесье» (Сеть магазинов)',
      unp: '200000456',
      subLimit: 20000,
      currentDebt: 12500,
      averagePaymentDays: 28,
      riskCategory: 'Reliable',
      overdueDebt: 0,
    },
    {
      id: '3',
      name: 'ОАО «Кузлитмаш» (Снабжение)',
      unp: '200024151',
      subLimit: 15000,
      currentDebt: 8200,
      averagePaymentDays: 55,
      riskCategory: 'UnderControl',
      overdueDebt: 0,
    },
    {
      id: '4',
      name: 'ОАО «Пинский мясокомбинат» (Торговый дом)',
      unp: '200000999',
      subLimit: 10000,
      currentDebt: 1600,
      averagePaymentDays: 78,
      riskCategory: 'StopList',
      overdueDebt: 1600,
    }
  ]);

  // 4. БАЗА РЕЕСТРОВ ОПЕРАЦИЙ
  const [registries, setRegistries] = useState<FactoringRegistry[]>([
    {
      id: '1',
      registryNumber: 'РЕЕСТР-406/01',
      contractNumber: 'ФАКТ-2026/406',
      clientName: 'ОАО «Кузлитмаш»',
      createdAt: '12.11.2026',
      totalAmount: 30000,
      advanceAmount: 24000,
      commissionAmount: 750,
      status: 'Financed',
      invoices: [],
    },
    {
      id: '2',
      registryNumber: 'РЕЕСТР-406/02',
      contractNumber: 'ФАКТ-2026/407',
      clientName: 'ОАО «Полесье»',
      createdAt: '10.11.2026',
      totalAmount: 15000,
      advanceAmount: 12750,
      commissionAmount: 375,
      status: 'Financed',
      invoices: [],
    }
  ]);

  const handleAddContract = (newContract: FactoringContract) => {
    setContracts(prev => [newContract, ...prev]);
  };

  const handleAddClient = (newClient: ClientItem) => {
    setClients(prev => [newClient, ...prev]);
  };

  const handleAddDebtor = (newDebtor: DebtorItem) => {
    setDebtors(prev => [newDebtor, ...prev]);
  };

  const handleAddRegistry = (newRegistry: FactoringRegistry) => {
    setRegistries(prev => [newRegistry, ...prev]);
    setAvailableLimit(prev => Math.max(0, prev - newRegistry.advanceAmount));
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
        {/* Боковое меню без настроек */}
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />

        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Шапка со сквозным поиском и профилем входа */}
          <Header 
            onToggleMenu={() => setIsMobileMenuOpen(true)}
            clients={clients}
            contracts={contracts}
            debtors={debtors}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Routes>
              <Route 
                path="/" 
                element={
                  <DashboardPage 
                    availableLimit={availableLimit}
                    onAddContract={handleAddContract} 
                    onAddRegistry={handleAddRegistry}
                  />
                } 
              />
              <Route 
                path="/contracts" 
                element={
                  <ContractsPage 
                    contracts={contracts} 
                    onAddContract={handleAddContract} 
                  />
                } 
              />
              <Route 
                path="/clients" 
                element={
                  <ClientsPage 
                    clients={clients} 
                    onAddClient={handleAddClient} 
                  />
                } 
              />
              <Route 
                path="/debtors" 
                element={
                  <DebtorsPage 
                    debtors={debtors} 
                    onAddDebtor={handleAddDebtor} 
                  />
                } 
              />
              <Route 
                path="/operations" 
                element={
                  <OperationsPage 
                    registries={registries}
                    availableLimit={availableLimit}
                    onAddRegistry={handleAddRegistry}
                  />
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <AnalyticsPage 
                    debtors={debtors} 
                    registries={registries} 
                  />
                } 
              />
              <Route 
                path="/reports" 
                element={<ReportsPage />} 
              />
            </Routes>
          </main>
        </div>

        {/* Модалка входа в админку / смены роли */}
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentRole={currentUser.role}
          onLogin={(userData) => setCurrentUser(userData)}
        />
      </div>
    </BrowserRouter>
  );
}