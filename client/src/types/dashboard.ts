// Метрики карточек лимитов
export interface KpiMetrics {
    totalLimit : number,
    usedLimit: number,
    availableLimit: number,
    overdueDebt: number
}

// Для графиков речакт
export interface PortfolioPoint{
    month: string,
    amount: number
}
// анализ контрагентов
export interface TurnoverPoint {
    counterparty: string,
    days: number
}
//бизнес статусы
export type OperationStatus = 'Financed'|'Pending'|'Paid'|'Overdue';
//запись в реестре последних событий
export interface RecentOperation {
    id:string,
    date: string,
    counterparty: string,
    amount: number,
    status: OperationStatus
}
export interface FactoringContract {
  id: string;
  contractNumber: string;
  clientName: string;
  advanceRate: number;
  factoringType: 'WithRecourse' | 'WithoutRecourse';
  createdAt: string;
  status: 'Active' | 'Suspended' | 'Closed'; // 👈 ТЕПЕРЬ ПОЛНОЕ СОВПАДЕНИЕ С C#
}
// Отдельная товарно-транспортная накладная (ТТН) внутри реестра
export interface InvoiceItem {
  id: string;
  number: string;         // Номер ТТН (например, ТТН-00918)
  debtorName: string;     // Покупатель (ЗАО "Пинскдрев")
  amount: number;         // Сумма по накладной в BYN
  dueDate: string;        // Дата, до которой покупатель должен вернуть деньги
}

// Реестр переданных денежных требований
export interface FactoringRegistry {
  id: string;
  registryNumber: string; // Номер реестра (РЕЕСТР-406/12)
  contractNumber: string; // По какому договору финансируется
  clientName: string;     // Клиент банка (Поставщик)
  createdAt: string;      // Дата передачи в банк
  totalAmount: number;    // Общая сумма требований
  advanceAmount: number;  // Сумма профинансированного аванса (80%)
  commissionAmount: number; // Комиссионное вознаграждение банка (2.5%)
  status: 'Financed' | 'UnderReview' | 'Rejected';
  invoices: InvoiceItem[];// Список накладных
}
// клиент банка - поставщик 
export interface ClientItem {
    id:string,
    name: string,
    unp:string, //Унп(9 цифр)
    iban: string,//расчетный счет
    factoringLimit: number,//утвержденный лимит
    usedLimit:number,
    rating: 'A'|'B'|'C', // рейтинг надежности
    activeContractsCount:number
}
export type DebtorRiskCategory = 'Reliable' | 'UnderControl' | 'StopList';
export interface DebtorItem {
    id:string,
    name:string,
    unp:string,
    subLimit:number,
    currentDebt: number,
    averagePaymentDays:number;
    riskCategory: DebtorRiskCategory,
    overdueDebt: number
}