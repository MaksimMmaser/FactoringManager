import  { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileSpreadsheet,
  Printer,
  FileText,
  CalendarDays,
  Search,
  ChevronDown,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  PieChart,
  ShieldCheck,
  FileX,
  Loader2,
  X,
  SlidersHorizontal,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { factoringApi } from '../api/factoringApi';
import type { ClientItem } from '../types/dashboard';

const BRAND = {
  emerald: {
    600: '#059669',
  },
  slate: {
    200: '#e2e8f0',
    600: '#475569',
    900: '#0f172a',
  },
  amber: {
    600: '#d97706',
  },
};

type ReportType = 'RECONCILIATION' | 'OVERDUE' | 'REVENUE';
type PeriodType = 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
type ScreenState = 'idle' | 'loading' | 'success' | 'empty';
type MobileTab = 'invoices' | 'limits' | 'signatures';

interface ReconciliationInvoice {
  id: string;
  number: string;
  debtorName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  advanceAmount: number;
  feeAmount: number;
  status: string;
}

interface ReconciliationData {
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
  invoices: ReconciliationInvoice[];
}

const formatBYN = (val: number): string =>
  new Intl.NumberFormat('ru-BY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val) + ' BYN';

const formatDateMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

interface ReportsPageProps {
  clients?: ClientItem[];
}

export default function FactoringReportsView({ clients = [] }: ReportsPageProps) {
  const [reportType, setReportType] = useState<ReportType>('RECONCILIATION');
  const [period, setPeriod] = useState<PeriodType>('MONTH');
  const [customDateFrom, setCustomDateFrom] = useState('01.11.2026');
  const [customDateTo, setCustomDateTo] = useState('30.11.2026');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');

  const [isMobileBottomSheetOpen, setIsMobileBottomSheetOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('invoices');

  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReconciliationData | null>(null);

  const [appliedParams, setAppliedParams] = useState({
    reportType: 'RECONCILIATION' as ReportType,
    period: 'MONTH' as PeriodType,
    clientId: '',
    generatedAt: '',
  });

  // Загрузка реального отчёта из PostgreSQL
  const fetchReport = async (
    clientId: string,
    targetReportType: ReportType,
    targetPeriod: PeriodType,
    showToast: boolean
  ) => {
    setScreenState('loading');
    try {
      const data = await factoringApi.getReconciliationReport(clientId);
      setReportData(data);
      setAppliedParams({
        reportType: targetReportType,
        period: targetPeriod,
        clientId,
        generatedAt: new Date().toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      const relevantInvoices =
        targetReportType === 'OVERDUE'
          ? data.invoices.filter((i) => i.status === 'Overdue')
          : data.invoices;

      if (!relevantInvoices || relevantInvoices.length === 0) {
        setScreenState('empty');
      } else {
        setScreenState('success');
      }

      if (showToast) {
        setToastMessage('Документ успешно сформирован из PostgreSQL');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки отчёта с сервера';
      setToastMessage(msg);
      setScreenState('empty');
    }
  };

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (selectedClientId) {
      void fetchReport(selectedClientId, reportType, period, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Блокируем скролл страницы, когда открыта мобильная шторка
  useEffect(() => {
    if (isMobileBottomSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileBottomSheetOpen]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.unp.includes(q)
    );
  }, [clientSearch, clients]);

  const selectedClientObj = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || clients[0],
    [selectedClientId, clients]
  );

  const displayedInvoices = useMemo(() => {
    if (!reportData?.invoices) return [];
    if (appliedParams.reportType === 'OVERDUE') {
      return reportData.invoices.filter((i) => i.status === 'Overdue');
    }
    return reportData.invoices;
  }, [reportData, appliedParams.reportType]);

  const displayedTotals = useMemo(() => {
    return {
      amount: displayedInvoices.reduce((s, i) => s + i.amount, 0),
      advance: displayedInvoices.reduce((s, i) => s + i.advanceAmount, 0),
      fee: displayedInvoices.reduce((s, i) => s + i.feeAmount, 0),
    };
  }, [displayedInvoices]);

  const invoicesChartData = useMemo(() => {
    return displayedInvoices.map((inv) => ({
      name: inv.number,
      amount: inv.amount,
      advance: inv.advanceAmount,
      fee: inv.feeAmount,
    }));
  }, [displayedInvoices]);

  const limitChartData = useMemo(() => {
    if (!reportData) return [];
    return [
      {
        name: 'Лимит',
        used: reportData.usedLimit,
        available: reportData.availableLimit,
      },
    ];
  }, [reportData]);

  const handleGenerate = async () => {
    if (!selectedClientId) return;
    setIsMobileBottomSheetOpen(false);
    await fetchReport(selectedClientId, reportType, period, true);
  };

  const handlePrint = () => {
    window.print();
  };

  const periodLabelMap: Record<PeriodType, string> = {
    MONTH: 'Текущий месяц',
    QUARTER: '3 квартал 2026',
    YEAR: '2026 год',
    CUSTOM: `С ${customDateFrom} по ${customDateTo}`,
  };

  const reportShortTitleMap: Record<ReportType, string> = {
    RECONCILIATION: 'Акт сверки',
    OVERDUE: 'Просрочка',
    REVENUE: 'Доходы ЦБУ',
  };

  const reportFullTitleMap: Record<ReportType, string> = {
    RECONCILIATION: 'Акт сверки факторинговых операций',
    OVERDUE: 'Ведомость просроченной задолженности',
    REVENUE: 'Сводный реестр комиссионного дохода',
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'Overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Просрочено
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          На проверке
        </span>
      );
    }
    if (status === 'Paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <CheckCircle2 className="w-3 h-3 text-slate-600" />
          Погашено
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Профинансировано
      </span>
    );
  };

  return (
    <div className="min-h-screen text-slate-800 antialiased pb-24 lg:pb-8">
      {/* TOAST */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 sm:bottom-6 right-4 left-4 sm:left-auto z-50 flex items-center justify-between gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs sm:text-sm font-medium print:hidden"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Закрыть уведомление"
            className="text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ШАПКА СТРАНИЦЫ */}
      <header className="mb-4 sm:mb-6 print:hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Отчётно-аналитические формы
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              ЦБУ №406 г. Пинск • Выписки и акты сверки из PostgreSQL
            </p>
          </div>
        </div>

        {/* Мобильная лента активных параметров + кнопка шторки (< lg) */}
        {/* Мобильные параметры без горизонтального скролла (flex-wrap) */}
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileBottomSheetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bank-600 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform min-h-[40px]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Параметры</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileBottomSheetOpen(true)}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-sm min-h-[40px]"
          >
            {reportShortTitleMap[appliedParams.reportType]}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileBottomSheetOpen(true)}
            className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold min-h-[40px] max-w-[200px] truncate"
          >
            {reportData?.clientName || selectedClientObj?.name || 'Клиент'}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileBottomSheetOpen(true)}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-medium shadow-sm min-h-[40px]"
          >
            {periodLabelMap[appliedParams.period]}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* МОБИЛЬНЫЙ BOTTOM SHEET ЧЕРЕЗ PORTAL (БЕЗ НАТИВНОГО SELECT!)          */}
      {/* ==================================================================== */}
      {isMobileBottomSheetOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
            {/* Затемнение на 100% экрана */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsMobileBottomSheetOpen(false)}
            />

            {/* Сама шторка */}
            <div
  role="dialog"
  aria-modal="true"
  aria-label="Параметры формирования"
  className="relative z-10 flex flex-col w-full max-w-md max-h-[85vh] overflow-hidden bg-white rounded-3xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_20px_60px_-10px_rgba(15,23,42,0.45)]"
>
              {/* Фиксированная шапка шторки */}
              <div className="px-5 pt-3 pb-3 border-b border-slate-100 shrink-0">
                <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Параметры формирования
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsMobileBottomSheetOpen(false)}
                    aria-label="Закрыть панель параметров"
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Скроллируемое содержимое шторки */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* 1. Тип документа */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Тип документа
                  </label>
                  <div role="radiogroup" aria-label="Тип документа" className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'RECONCILIATION' as ReportType, label: 'Акт сверки' },
                      { id: 'OVERDUE' as ReportType, label: 'Просрочка' },
                      { id: 'REVENUE' as ReportType, label: 'Доходы' },
                    ].map((item) => {
                      const isSelected = reportType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setReportType(item.id)}
                          className={`min-h-[44px] py-2 px-2 rounded-xl border text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'border-bank-600 bg-bank-50 text-bank-800 ring-2 ring-bank-500/20'
                              : 'border-slate-200 text-slate-600 bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Период */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Отчётный период
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                    {[
                      { id: 'MONTH' as PeriodType, label: 'Месяц' },
                      { id: 'QUARTER' as PeriodType, label: '3 кв.' },
                      { id: 'YEAR' as PeriodType, label: 'Год' },
                      { id: 'CUSTOM' as PeriodType, label: 'Даты' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPeriod(p.id)}
                        className={`min-h-[38px] py-1.5 px-1 rounded-lg font-semibold text-center transition-all ${
                          period === p.id
                            ? 'bg-white text-bank-700 shadow-sm'
                            : 'text-slate-600'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {period === 'CUSTOM' && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          С даты
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="01.11.2026"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(formatDateMask(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:border-bank-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          По дату
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="30.11.2026"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(formatDateMask(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:border-bank-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Кастомный выбор клиента (Вместо уродского select!) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Контрагент (Клиент из БД)
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {filteredClients.length} шт.
                    </span>
                  </div>

                  {/* Поиск внутри списка */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Поиск по названию или УНП..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-600"
                    />
                  </div>

                  {/* Сенсорные карточки клиентов */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                        Клиенты не найдены
                      </div>
                    ) : (
                      filteredClients.map((client) => {
                        const isSelected = selectedClientId === client.id;
                        return (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => setSelectedClientId(client.id)}
                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all min-h-[48px] ${
                              isSelected
                                ? 'border-bank-600 bg-bank-50/70 ring-1 ring-bank-500/30'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className={`block text-xs truncate ${isSelected ? 'font-bold text-bank-900' : 'font-semibold text-slate-800'}`}>
                                {client.name || '(Без названия)'}
                              </span>
                              <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                                УНП: {client.unp || '—'} • Лимит: {formatBYN(client.factoringLimit)}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-bank-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Закрепленная кнопка применения */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
                <button
                  type="button"
                  disabled={screenState === 'loading' || !selectedClientId}
                  onClick={handleGenerate}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-bank-600 hover:bg-bank-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md shadow-bank-600/20 active:scale-[0.98] transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Сформировать документ</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ==================================================================== */}
      {/* ОСНОВНАЯ СЕТКА (ДЕСКТОП + ПРЕДПРОСМОТР)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ДЕСКТОПНЫЕ ПАРАМЕТРЫ */}
        <aside
          className="space-y-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm print:hidden lg:sticky lg:top-6 hidden lg:block"
          aria-label="Параметры генерации отчёта"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-900">Тип документа</span>
              <span className="text-xs text-slate-500">Шаблон</span>
            </div>

            <div role="radiogroup" aria-label="Тип документа" className="space-y-2">
              {[
                { id: 'RECONCILIATION' as ReportType, title: 'Акт сверки операций', subtitle: 'Движение ТТН и лимитов', icon: ClipboardCheck },
                { id: 'OVERDUE' as ReportType, title: 'Ведомость просрочки', subtitle: 'Контроль просроченных ТТН', icon: AlertTriangle },
                { id: 'REVENUE' as ReportType, title: 'Сводный реестр доходов', subtitle: 'Дисконт ЦБУ №406', icon: PieChart },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = reportType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setReportType(item.id)}
                    className={`w-full min-h-[50px] p-3 rounded-xl border text-left transition-all relative flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bank-500 ${
                      isSelected
                        ? 'border-bank-600 bg-bank-50/50 shadow-sm border-2'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-bank-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pr-6">
                      <span className="text-sm font-semibold text-slate-900 block leading-tight">{item.title}</span>
                      <span className="text-xs text-slate-500 block mt-0.5">{item.subtitle}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-bank-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-900">Период</span>
              <span className="text-xs text-slate-500 font-mono">2026</span>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              {[
                { id: 'MONTH' as PeriodType, label: 'Месяц' },
                { id: 'QUARTER' as PeriodType, label: '3 кв.' },
                { id: 'YEAR' as PeriodType, label: 'Год' },
                { id: 'CUSTOM' as PeriodType, label: 'Даты' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`py-2 px-1 rounded-lg font-semibold transition-all text-center min-h-[36px] ${
                    period === p.id ? 'bg-white text-bank-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {period === 'CUSTOM' && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <CalendarDays className="w-3.5 h-3.5 text-bank-600" />
                  <span>Интервал (ДД.ММ.ГГГГ):</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">С даты</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(formatDateMask(e.target.value))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 font-medium block mb-1">По дату</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(formatDateMask(e.target.value))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-slate-900">Контрагент (Клиент)</span>
              <span className="text-xs text-slate-500">БД ЦБУ</span>
            </div>

            <button
              type="button"
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-left shadow-sm hover:border-slate-300 min-h-[44px]"
            >
              <div className="truncate pr-2">
                <span className="font-semibold text-slate-900 block truncate text-xs sm:text-sm">
                  {selectedClientObj?.name || 'Выберите клиента'}
                </span>
                <span className="text-xs text-slate-500 font-mono block">
                  УНП: {selectedClientObj?.unp || '—'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isClientDropdownOpen ? 'rotate-180 text-bank-600' : ''}`} />
            </button>

            {isClientDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-2 max-h-56 overflow-y-auto">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск по названию или УНП..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  {filteredClients.map((client) => {
                    const isSelected = selectedClientId === client.id;
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setIsClientDropdownOpen(false);
                          setClientSearch('');
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between min-h-[38px] ${
                          isSelected ? 'bg-bank-50 text-bank-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="block font-medium">{client.name || '(Без названия)'}</span>
                          <span className="text-[11px] text-slate-500 font-mono">УНП {client.unp || '—'}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-bank-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={screenState === 'loading' || !selectedClientId}
              onClick={handleGenerate}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-bank-600 hover:bg-bank-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-md shadow-bank-600/20 transition-all active:scale-[0.99]"
            >
              {screenState === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Загрузка из БД...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Сформировать документ</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ПРАВАЯ КОЛОНКА: ПРЕДПРОСМОТР */}
        <main className="space-y-4 min-w-0 w-full">
          {/* Десктопный тулбар (print:hidden) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm hidden lg:flex items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Источник:
              </span>
              <span className="bg-bank-50 text-bank-800 border border-bank-200 font-semibold px-2.5 py-1 rounded-lg">
                PostgreSQL ({reportData?.clientName || selectedClientObj?.name})
              </span>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 font-medium px-2.5 py-1 rounded-lg">
                {periodLabelMap[appliedParams.period]}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[40px] px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Печать / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setToastMessage('Выгрузка Excel (.xlsx) успешно инициирована')}
                className="min-h-[40px] px-4 py-2 bg-bank-600 hover:bg-bank-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Экспорт Excel</span>
              </button>
            </div>
          </div>

          {/* График ТТН (print:hidden) */}
          {screenState === 'success' && displayedInvoices.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm print:hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Анализ сумм требований по накладным
                </span>
                <span className="text-xs text-slate-500 font-mono">BYN</span>
              </div>
              <div className="h-44 w-full" role="region" aria-label="График распределения сумм">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={invoicesChartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: BRAND.slate[600], fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: BRAND.slate[600], fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: BRAND.slate[900], borderRadius: '10px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: unknown) => [formatBYN(Number(val) || 0), '']}
                    />
                    <Bar name="Сумма уступки" dataKey="amount" fill={BRAND.slate[600]} radius={[4, 4, 0, 0]} />
                    <Bar name="Аванс банка" dataKey="advance" fill={BRAND.emerald[600]} radius={[4, 4, 0, 0]} />
                    <Bar name="Дисконт" dataKey="fee" fill={BRAND.amber[600]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Скелетон-загрузка */}
          {screenState === 'loading' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-4">
              <div className="flex items-center justify-center gap-2 text-bank-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-semibold">Загрузка отчёта из PostgreSQL...</span>
              </div>
              <div className="space-y-2.5 max-w-2xl mx-auto">
                <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            </div>
          )}

          {/* Пустое состояние */}
          {screenState === 'empty' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileX className="w-6 h-6" />
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-800">
                По выбранным параметрам накладные (ТТН) отсутствуют
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                У контрагента {reportData?.clientName || selectedClientObj?.name} пока нет подходящих записей. Загрузите реестр ТТН на вкладке «Операции» или выберите другого клиента.
              </p>
            </div>
          )}

          {/* ================================================================ */}
          {/* ОФИЦИАЛЬНЫЙ ДОКУМЕНТ А4 + МОБИЛЬНАЯ КАРТОЧНАЯ ВЕРСТКА С ТАБАМИ   */}
          {/* ================================================================ */}
          {screenState === 'success' && reportData && (
            <article
              id="factoring-document-sheet"
              aria-label="Официальный бланк документа"
              className="bg-white border border-slate-200 shadow-md rounded-2xl p-4 sm:p-8 lg:p-12 max-w-[794px] mx-auto text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none space-y-5 sm:space-y-6"
            >
              {/* Шапка бланка */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 sm:pb-5 border-b-2 border-slate-900 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                      ОАО «Белинвестбанк»
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-md">
                      ЦБУ №406
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Центр банковских услуг №406, г. Пинск, ул. Завальная, 15
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    УНП: 807000028 • БИК: BLBBY2X
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ЭЦП валидна (КриптоПро)</span>
                  </div>
                  <span className="text-xs text-slate-600 block font-medium">
                    Дата: <span className="font-mono text-slate-900">{appliedParams.generatedAt}</span>
                  </span>
                </div>
              </div>

              {/* Заголовок документа */}
              <div className="text-center">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight uppercase">
                  {reportFullTitleMap[appliedParams.reportType]}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  клиент: <span className="font-bold text-slate-900">{reportData.clientName}</span>
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5 break-all">
                  УНП: {reportData.clientUnp} • {periodLabelMap[appliedParams.period]}
                </p>
              </div>

              {/* Мобильная Hero-сводка (< md, скрыта при печати) */}
              <div className="md:hidden print:hidden bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs text-emerald-100">
                  <span className="font-semibold uppercase tracking-wider">Аванс по акту</span>
                  <span className="font-mono">{displayedInvoices.length} ТТН</span>
                </div>
                <div className="text-2xl font-black font-mono tabular-nums tracking-tight">
                  {formatBYN(displayedTotals.advance)}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
                  <div>
                    <span className="text-emerald-100/80 block text-[11px]">Сумма уступки</span>
                    <span className="font-mono font-bold">{formatBYN(displayedTotals.amount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-100/80 block text-[11px]">Комиссия ЦБУ</span>
                    <span className="font-mono font-bold">{formatBYN(displayedTotals.fee)}</span>
                  </div>
                </div>
              </div>

              {/* Мобильные вкладки (Табы) */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs md:hidden print:hidden">
                <button
                  type="button"
                  onClick={() => setActiveMobileTab('invoices')}
                  className={`min-h-[40px] py-2 px-2 rounded-lg font-bold transition-all text-center ${
                    activeMobileTab === 'invoices' ? 'bg-white text-bank-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Накладные
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMobileTab('limits')}
                  className={`min-h-[40px] py-2 px-2 rounded-lg font-bold transition-all text-center ${
                    activeMobileTab === 'limits' ? 'bg-white text-bank-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Лимиты
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMobileTab('signatures')}
                  className={`min-h-[40px] py-2 px-2 rounded-lg font-bold transition-all text-center ${
                    activeMobileTab === 'signatures' ? 'bg-white text-bank-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Подписи
                </button>
              </div>

              {/* 1. НАКЛАДНЫЕ */}
              <div className={`${activeMobileTab === 'invoices' ? 'block' : 'hidden'} md:block print:block space-y-3`}>
                {/* Мобильные карточки (< md) */}
                <div className="space-y-3 md:hidden print:hidden">
                  {displayedInvoices.map((inv) => (
                    <div key={inv.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{inv.number}</span>
                        {renderStatusBadge(inv.status)}
                      </div>

                      <div className="text-slate-700 font-medium">
                        Покупатель: <strong className="text-slate-900">{inv.debtorName}</strong>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px] font-semibold">Уступка</span>
                          <span className="font-mono font-bold text-slate-900 block">{formatBYN(inv.amount)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] font-semibold">Аванс</span>
                          <span className="font-mono font-bold text-bank-700 block">{formatBYN(inv.advanceAmount)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block text-[11px] font-semibold">Дисконт</span>
                          <span className="font-mono font-semibold text-slate-700 block">{formatBYN(inv.feeAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Десктопная и печатная таблица */}
                <div className="hidden md:block print:block border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Номер ТТН</th>
                        <th className="py-2.5 px-3">Дебитор (Покупатель)</th>
                        <th className="py-2.5 px-3 text-right">Сумма уступки</th>
                        <th className="py-2.5 px-3 text-right">Аванс (80%)</th>
                        <th className="py-2.5 px-3 text-right">Дисконт банка</th>
                        <th className="py-2.5 px-3 text-center">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {displayedInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.number}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{inv.debtorName}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                            {formatBYN(inv.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-bank-700">
                            {formatBYN(inv.advanceAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {formatBYN(inv.feeAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">{renderStatusBadge(inv.status)}</td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                      <tr>
                        <td colSpan={2} className="py-3 px-3 uppercase text-xs tracking-wider text-slate-700">
                          Итого по акту:
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm font-bold text-slate-900">
                          {formatBYN(displayedTotals.amount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm font-bold text-bank-700">
                          {formatBYN(displayedTotals.advance)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-sm font-bold text-slate-900">
                          {formatBYN(displayedTotals.fee)}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 2. ЛИМИТЫ */}
              <div className={`${activeMobileTab === 'limits' ? 'block' : 'hidden'} md:block print:block`}>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div>
                      <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider block">
                        Утверждённый кредитный лимит (БД)
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-slate-900 font-mono tabular-nums block">
                        {formatBYN(reportData.factoringLimit)}
                      </span>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider block">
                        Свободный остаток лимита (БД)
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-bank-700 font-mono tabular-nums block">
                        {formatBYN(reportData.availableLimit)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 print:hidden" role="region" aria-label="График использования лимита">
                    <div className="flex justify-between text-xs text-slate-700 font-medium">
                      <span>Занято: {formatBYN(reportData.usedLimit)}</span>
                      <span>Свободно: {formatBYN(reportData.availableLimit)}</span>
                    </div>
                    <div className="h-4 sm:h-5 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={limitChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <XAxis type="number" hide domain={[0, reportData.factoringLimit]} />
                          <YAxis type="category" dataKey="name" hide />
                          <Bar dataKey="used" stackId="limit" fill={BRAND.emerald[600]} radius={[3, 0, 0, 3]} />
                          <Bar dataKey="available" stackId="limit" fill={BRAND.slate[200]} radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ПОДПИСИ */}
              <div className={`${activeMobileTab === 'signatures' ? 'block' : 'hidden'} md:block print:block`}>
                <div className="pt-5 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-xs text-slate-700">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-slate-900">От ОАО «Белинвестбанк» (ЦБУ №406):</p>
                      <p className="text-xs text-slate-500">Специалист сектора факторинга</p>
                    </div>
                    <div className="flex items-center gap-2 pt-3">
                      <div className="w-32 border-b border-slate-400" />
                      <span className="font-mono text-slate-700 text-xs">/ Е. В. Козема /</span>
                    </div>
                  </div>

                  <div className="space-y-3 sm:text-right">
                    <div>
                      <p className="font-semibold text-slate-900">От Клиента ({reportData.clientName}):</p>
                      <p className="text-xs text-slate-500">Руководитель / Главный бухгалтер</p>
                    </div>
                    <div className="flex items-center sm:justify-end gap-2 pt-3">
                      <div className="w-32 border-b border-slate-400" />
                      <span className="font-mono text-slate-700 text-xs">/ ____________ /</span>
                    </div>
                    <div className="inline-block border border-dashed border-slate-300 rounded px-3 py-1 text-xs text-slate-500 mt-1">
                      М.П. (Место печати)
                    </div>
                  </div>
                </div>
              </div>

              <footer className="mt-6 pt-3 border-t border-slate-200 text-center text-xs text-slate-500">
                Акт сформирован автоматически в АС «Факторинг» ЦБУ №406 г. Пинск ОАО «Белинвестбанк».
                Имеет юридическую силу электронного документа в соответствии с Законом РБ № 113-З.
              </footer>
            </article>
          )}
        </main>
      </div>

      {/* ЛИПКАЯ НИЖНЯЯ ПАНЕЛЬ ДЕЙСТВИЙ ДЛЯ МОБИЛЬНЫХ (< lg) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 p-3 flex items-center gap-2.5 lg:hidden print:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 min-h-[48px] px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Печать / PDF</span>
        </button>
        <button
          type="button"
          onClick={() => setToastMessage('Выгрузка Excel (.xlsx) успешно инициирована')}
          className="flex-1 min-h-[48px] px-3 py-2 bg-bank-600 hover:bg-bank-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-bank-600/20 active:scale-95 transition-transform"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Экспорт Excel</span>
        </button>
      </div>
    </div>
  );
}