import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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
import { factoringApi, API_BASE_URL } from './api/factoringApi';
import type { DashboardResponse } from './api/factoringApi';
import type {
  FactoringContract,
  FactoringRegistry,
  ClientItem,
  DebtorItem,
} from './types/dashboard';

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState({
    name: 'Козема Е. В.',
    role: 'Специалист по факторингу (ЦБУ №406)',
    login: 'officer-406',
  });

  // Состояния загрузки
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Живые данные из базы PostgreSQL
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [contracts, setContracts] = useState<FactoringContract[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [debtors, setDebtors] = useState<DebtorItem[]>([]);
  const [registries, setRegistries] = useState<FactoringRegistry[]>([]);

  // Загрузка всех разделов параллельно
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [dashRes, clientsRes, debtorsRes, contractsRes, registriesRes] =
        await Promise.all([
          factoringApi.getDashboard(),
          factoringApi.getClients(),
          factoringApi.getDebtors(),
          factoringApi.getContracts(),
          factoringApi.getRegistries(),
        ]);

      setDashboard(dashRes);
      setClients(clientsRes);
      setDebtors(debtorsRes);
      setContracts(contractsRes);
      setRegistries(registriesRes);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : 'Не удалось подключиться к серверу факторинга.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  // Обработчики реальных сохранений в PostgreSQL:
 const handleAddContract = async (newContractData: any) => {
    // Убрали try-catch и alert, чтобы ошибка пролетела в форму!
    await factoringApi.createContract({
      contractNumber: newContractData.contractNumber,
      clientId: newContractData.clientId,
      factoringType: newContractData.factoringType,
      advanceRate: newContractData.advanceRate,
    });
    await loadAllData();
  };

  const handleAddClient = async (newClientData: any) => {
    // Убираем alert(), чтобы ошибка долетела до try-catch модалки!
    await factoringApi.createClient({
      name: newClientData.name,
      unp: newClientData.unp,
      iban: newClientData.iban,
      factoringLimit: newClientData.factoringLimit,
      rating: newClientData.rating,
    });
    await loadAllData();
  };

  const handleAddDebtor = async (newDebtorData: any) => {
    await factoringApi.createDebtor({
      name: newDebtorData.name,
      unp: newDebtorData.unp,
      subLimit: newDebtorData.subLimit,
      averagePaymentDays: newDebtorData.averagePaymentDays,
      riskCategory: newDebtorData.riskCategory,
    });
    await loadAllData();
  };

  const handleAddRegistry = async (newRegistryData: any) => {
    // Убрали alert(), пробрасываем ошибку в модалку!
    await factoringApi.createRegistry({
      contractId: newRegistryData.contractId,
      invoices: newRegistryData.invoices.map((inv: any) => ({
        number: inv.number,
        debtorId: inv.debtorId,
        issueDate: new Date().toISOString(),
        dueDate: new Date(inv.dueDate || Date.now() + 30 * 86400000).toISOString(),
        amount: Number(inv.amount),
      })),
    });
    await loadAllData();
  };

  const handleRepayInvoice = async (invoiceId: string) => {
    try {
      await factoringApi.repayInvoice(invoiceId);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Ошибка погашения');
    }
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 w-full">
          <Header
            onToggleMenu={() => setIsMobileMenuOpen(true)}
            clients={clients}
            contracts={contracts}
            debtors={debtors}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-bank-600" />
                <p className="text-sm font-semibold text-slate-600">
                  Загрузка данных из PostgreSQL ({API_BASE_URL})...
                </p>
              </div>
            ) : apiError || !dashboard ? (
              <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm max-w-md mx-auto my-12 space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Сервер API недоступен
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">{apiError}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-2">
                    Адрес: {API_BASE_URL}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadAllData()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-bank-600 hover:bg-bank-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Повторить подключение
                </button>
              </div>
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={
                    <DashboardPage
                      dashboard={dashboard}
                      clients={clients}
                      contracts={contracts}
                      debtors={debtors}
                      onAddContract={handleAddContract}
                      onAddRegistry={handleAddRegistry}
                      onRepayInvoice={handleRepayInvoice}
                    />
                  }
                />
                <Route
                  path="/contracts"
                  element={
                    <ContractsPage
                      contracts={contracts}
                      clients={clients} // 👈 Передаем реальных клиентов!
                      onAddContract={handleAddContract}
                    />
                  }
                />
                <Route
                  path="/operations"
                  element={
                    <OperationsPage
                      registries={registries}
                      contracts={contracts} // 👈 Передаем реальные договоры!
                      debtors={debtors}     // 👈 Передаем реальных дебиторов!
                      availableLimit={dashboard.metrics.availableLimit}
                      onAddRegistry={handleAddRegistry}
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
                      contracts={contracts}
                      debtors={debtors}    
                      availableLimit={dashboard.metrics.availableLimit}
                      onAddRegistry={handleAddRegistry}
                    />
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <AnalyticsPage debtors={debtors} registries={registries} />
                  }
                />
               <Route path="/reports" element={<ReportsPage clients={clients} />} />
              </Routes>
            )}
          </main>
        </div>

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