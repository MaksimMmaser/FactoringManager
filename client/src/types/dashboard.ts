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
export type OperationStatus = 'Financed'|'Pending'|'Paid'|'Overdur';
//запись в реестре последних событий
export interface RecentOperation {
    id:string,
    date: string,
    counterparty: string,
    amount: number,
    status: OperationStatus
}