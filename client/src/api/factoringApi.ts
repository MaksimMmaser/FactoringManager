import type {
  KpiMetrics,
  PortfolioPoint,
  TurnoverPoint,
  RecentOperation,
  FactoringContract,
  ClientItem,
  DebtorItem,
  FactoringRegistry,
} from '../types/dashboard';

// Берем адрес сервера из переменной окружения (по умолчанию локальный Docker на порту 5213)
export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5213';

// Структура DashboardDto с нашего C# бэкенда
export interface DashboardResponse {
  metrics: KpiMetrics;
  portfolioData: PortfolioPoint[];
  turnoverData: TurnoverPoint[];
  recentOperations: RecentOperation[];
}

// Единая обертка над fetch с разбором ошибок ProblemDetails (RFC 9457)
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // На случай запуска через ngrok-туннель
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Ошибка сервера (${response.status})`;
    try {
      const problem = await response.json();
      // Если пришли ошибки валидации FluentValidation (словарь errors)
      if (problem.errors && typeof problem.errors === 'object') {
        const firstErrors = Object.values(problem.errors).flat() as string[];
        if (firstErrors.length > 0) errorMessage = firstErrors.join(' ');
      } else if (problem.detail) {
        errorMessage = problem.detail;
      } else if (problem.message) {
        errorMessage = problem.message;
      } else if (problem.title) {
        errorMessage = problem.title;
      }
    } catch {
      // Если ответ не JSON — оставляем базовое сообщение со статусом
    }
    throw new Error(errorMessage);
  }

  // Для ответов 204 No Content
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// Набор методов для всех эндпоинтов нашего C# API
export const factoringApi = {
  // 1. Дашборд
  async getDashboard(): Promise<DashboardResponse> {
    const data = await apiFetch<DashboardResponse>('/api/Dashboard');
    return {
      ...data,
      recentOperations: data.recentOperations.map((op) => ({
        ...op,
        date: new Date(op.date).toLocaleDateString('ru-RU'),
      })),
    };
  },

  // 2. Клиенты
  getClients(): Promise<ClientItem[]> {
    return apiFetch<ClientItem[]>('/api/Clients');
  },

  // 3. Дебиторы
  getDebtors(): Promise<DebtorItem[]> {
    return apiFetch<DebtorItem[]>('/api/Debtors');
  },

  // 4. Договоры (приводим conclusionDate с бэкенда к формату createdAt для UI)
  async getContracts(): Promise<FactoringContract[]> {
    const raw = await apiFetch<
      Array<{
        id: string;
        contractNumber: string;
        clientId: string;
        clientName: string;
        advanceRate: number;
        factoringType: 'WithRecourse' | 'WithoutRecourse';
        conclusionDate: string;
        status: 'Active' | 'Suspended' | 'Closed';
      }>
    >('/api/Contracts');

    return raw.map((c) => ({
      id: c.id,
      contractNumber: c.contractNumber,
      clientName: c.clientName,
      advanceRate: c.advanceRate,
      factoringType: c.factoringType,
      createdAt: new Date(c.conclusionDate).toLocaleDateString('ru-RU'),
      status: c.status,
    }));
  },

  // 5. Реестры операций
  async getRegistries(): Promise<FactoringRegistry[]> {
    const raw = await apiFetch<FactoringRegistry[]>('/api/Registries');
    return raw.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt).toLocaleDateString('ru-RU'),
    }));
  },
  // 6. Создание клиента (POST /api/Clients)
  createClient(dto: {
    name: string;
    unp: string;
    iban: string;
    factoringLimit: number;
    rating: string;
  }): Promise<ClientItem> {
    return apiFetch<ClientItem>('/api/Clients', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // 7. Создание дебитора (POST /api/Debtors)
  createDebtor(dto: {
    name: string;
    unp: string;
    subLimit: number;
    averagePaymentDays: number;
    riskCategory: string;
  }): Promise<DebtorItem> {
    return apiFetch<DebtorItem>('/api/Debtors', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // 8. Создание договора (POST /api/Contracts)
  async createContract(dto: {
    contractNumber: string;
    clientId: string;
    factoringType: string;
    advanceRate: number;
  }): Promise<FactoringContract> {
    const raw = await apiFetch<{
      id: string;
      contractNumber: string;
      clientId: string;
      clientName: string;
      advanceRate: number;
      factoringType: 'WithRecourse' | 'WithoutRecourse';
      conclusionDate: string;
      status: 'Active' | 'Suspended' | 'Closed';
    }>('/api/Contracts', {
      method: 'POST',
      body: JSON.stringify(dto),
    });

    return {
      id: raw.id,
      contractNumber: raw.contractNumber,
      clientName: raw.clientName,
      advanceRate: raw.advanceRate,
      factoringType: raw.factoringType,
      createdAt: new Date(raw.conclusionDate).toLocaleDateString('ru-RU'),
      status: raw.status,
    };
  },

  // 9. Прием реестра ТТН (POST /api/Registries)
  async createRegistry(dto: {
    contractId: string;
    invoices: Array<{
      number: string;
      debtorId: string;
      issueDate: string;
      dueDate: string;
      amount: number;
    }>;
  }): Promise<FactoringRegistry> {
    const raw = await apiFetch<FactoringRegistry>('/api/Registries', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return {
      ...raw,
      createdAt: new Date(raw.createdAt).toLocaleDateString('ru-RU'),
    };
  },

  // 10. Погашение накладной (POST /api/Invoices/{id}/repay)
  repayInvoice(invoiceId: string): Promise<void> {
    return apiFetch<void>(`/api/Invoices/${invoiceId}/repay`, {
      method: 'POST',
    });
    
  },
  // 11. Получение реального акта сверки по клиенту из PostgreSQL
  getReconciliationReport(clientId: string): Promise<{
    clientId: string;
    clientName: string;
    clientUnp: string;
    clientIban: string;
    factoringLimit: number;
    usedLimit: number;
    availableLimit: number;
    generatedAt: string;
    totalAmount: number;
    totalAdvance: number;
    totalFee: number;
    invoices: Array<{
      id: string;
      number: string;
      debtorName: string;
      issueDate: string;
      dueDate: string;
      amount: number;
      advanceAmount: number;
      feeAmount: number;
      status: string;
    }>;
  }> {
    return apiFetch(`/api/Reports/reconciliation?clientId=${clientId}`);
  },
};