import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  AlertCircle,
  Loader2,
  X,
  Building2,
  RefreshCw,
  RotateCcw,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

// ==========================================
// ДИЗАЙН-ТОКЕНЫ И КОНСТАНТЫ
// ==========================================
const BRAND = {
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669', // Основной корпоративный изумрудный
    700: '#047857',
  },
  slate: {
    200: '#e2e8f0',
    500: '#64748b',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  amber: {
    500: '#f59e0b',
    600: '#d97706',
  }
};

// ==========================================
// ТИПЫ ДАННЫХ
// ==========================================
type ReportType = 'RECONCILIATION' | 'OVERDUE' | 'REVENUE';
type PeriodType = 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
type ScreenState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface ClientItem {
  id: string;
  name: string;
  unp: string;
  iban: string;
  factoringLimit: number;
  usedLimit: number;
}

interface InvoiceRow {
  id: string;
  number: string;
  debtor: string;
  amount: number;
  advance: number;
  fee: number;
  status: 'Financed' | 'Pending';
}

// ==========================================
// МОКОВЫЕ ДАННЫЕ
// ==========================================
const MOCK_CLIENTS: ClientItem[] = [
  {
    id: 'kuzlitmash',
    name: 'ОАО «Кузлитмаш»',
    unp: '200024151',
    iban: 'BY88BLBB30120000241510001001',
    factoringLimit: 55000,
    usedLimit: 13900,
  },
  {
    id: 'polesie',
    name: 'ОАО «Полесье» (Трикотаж)',
    unp: '200000456',
    iban: 'BY44BLBB30120000004560001002',
    factoringLimit: 40000,
    usedLimit: 12500,
  },
  {
    id: 'pinskdrev',
    name: 'ЗАО «ХК «Пинскдрев»',
    unp: '200000123',
    iban: 'BY22BLBB30120000001230001003',
    factoringLimit: 75000,
    usedLimit: 32000,
  },
  {
    id: 'meat_pinsk',
    name: 'ОАО «Пинский мясокомбинат»',
    unp: '200000999',
    iban: 'BY12BLBB30120000009990001004',
    factoringLimit: 25000,
    usedLimit: 1600,
  },
];

const MOCK_INVOICES: Record<string, InvoiceRow[]> = {
  kuzlitmash: [
    {
      id: 'inv-1',
      number: 'ТТН-004812',
      debtor: 'ЗАО «ХК «Пинскдрев»',
      amount: 30000.0,
      advance: 24000.0,
      fee: 750.0,
      status: 'Financed',
    },
    {
      id: 'inv-2',
      number: 'ТТН-004815',
      debtor: 'ОАО «Полесье»',
      amount: 12500.0,
      advance: 10000.0,
      fee: 312.5,
      status: 'Pending',
    },
    {
      id: 'inv-3',
      number: 'ТТН-004818',
      debtor: 'ОАО «Амкодор-Пинск»',
      amount: 8400.0,
      advance: 6720.0,
      fee: 210.0,
      status: 'Financed',
    },
  ],
  polesie: [
    {
      id: 'inv-4',
      number: 'ТТН-001092',
      debtor: 'ГУМ г. Минск',
      amount: 18000.0,
      advance: 14400.0,
      fee: 450.0,
      status: 'Financed',
    },
    {
      id: 'inv-5',
      number: 'ТТН-001099',
      debtor: 'ЦУМ Минск',
      amount: 14000.0,
      advance: 11200.0,
      fee: 350.0,
      status: 'Pending',
    },
  ],
  pinskdrev: [
    {
      id: 'inv-6',
      number: 'ТТН-009110',
      debtor: 'ООО «МебельМаркет»',
      amount: 45000.0,
      advance: 36000.0,
      fee: 1125.0,
      status: 'Financed',
    },
  ],
  meat_pinsk: [],
};

// ==========================================
// ФОРМАТИРОВАНИЕ ДЕНЕГ
// ==========================================
const formatBYN = (val: number): string =>
  new Intl.NumberFormat('ru-BY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val) + ' BYN';

// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ==========================================
export default function FactoringReportsView() {
  // --- Состояния параметров ---
  const [reportType, setReportType] = useState<ReportType>('RECONCILIATION');
  const [period, setPeriod] = useState<PeriodType>('MONTH');
  const [customDateFrom, setCustomDateFrom] = useState('2026-11-01');
  const [customDateTo, setCustomDateTo] = useState('2026-11-30');
  const [selectedClientId, setSelectedClientId] = useState('kuzlitmash');

  // --- Состояния UI контролов ---
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Состояние генерации / обратная связь ---
  const [screenState, setScreenState] = useState<ScreenState>('success');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appliedParams, setAppliedParams] = useState({
    reportType: 'RECONCILIATION' as ReportType,
    period: 'MONTH' as PeriodType,
    clientId: 'kuzlitmash',
    generatedAt: '16.11.2026, 14:35',
  });

  // Закрытие выпадающего списка при клике вне
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Автозакрытие тоста
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Фильтр списка клиентов в поиске
  const filteredClients = useMemo(() => {
    return MOCK_CLIENTS.filter(
      (c) =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.unp.includes(clientSearch)
    );
  }, [clientSearch]);

  const activeClient = useMemo(
    () => MOCK_CLIENTS.find((c) => c.id === appliedParams.clientId) || MOCK_CLIENTS[0],
    [appliedParams.clientId]
  );

  const activeInvoices = useMemo(
    () => MOCK_INVOICES[appliedParams.clientId] || [],
    [appliedParams.clientId]
  );

  // Итоговые агрегаты
  const totals = useMemo(() => {
    const totalAmount = activeInvoices.reduce((s, i) => s + i.amount, 0);
    const totalAdvance = activeInvoices.reduce((s, i) => s + i.advance, 0);
    const totalFee = activeInvoices.reduce((s, i) => s + i.fee, 0);
    const freeLimit = Math.max(0, activeClient.factoringLimit - activeClient.usedLimit);

    return {
      totalAmount,
      totalAdvance,
      totalFee,
      freeLimit,
    };
  }, [activeInvoices, activeClient]);

  // Данные для Recharts
  const invoicesChartData = useMemo(() => {
    return activeInvoices.map((inv) => ({
      name: inv.number,
      amount: inv.amount,
      advance: inv.advance,
      fee: inv.fee,
    }));
  }, [activeInvoices]);

  const limitChartData = useMemo(() => {
    return [
      {
        name: 'Лимит',
        used: activeClient.usedLimit,
        available: totals.freeLimit,
      },
    ];
  }, [activeClient, totals.freeLimit]);

  // Генерация отчета
  const handleGenerate = () => {
    setScreenState('loading');
    setTimeout(() => {
      // Имитация: если выбран клиент без накладных — empty
      if (selectedClientId === 'meat_pinsk') {
        setAppliedParams({
          reportType,
          period,
          clientId: selectedClientId,
          generatedAt: new Date().toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        setScreenState('empty');
        setToastMessage('Данные за выбранный период отсутствуют');
        return;
      }

      setAppliedParams({
        reportType,
        period,
        clientId: selectedClientId,
        generatedAt: new Date().toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      setScreenState('success');
      setToastMessage('Документ успешно сформирован');
    }, 700);
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

  const reportTitleMap: Record<ReportType, string> = {
    RECONCILIATION: 'Акт сверки факторинговых операций',
    OVERDUE: 'Ведомость просроченной задолженности',
    REVENUE: 'Сводный реестр комиссионного дохода',
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased p-4 sm:p-6 lg:p-8 font-sans">
      {/* ==================================================================== */}
      {/* ВСПЛЫВАЮЩИЙ TOAST                                                    */}
      {/* ==================================================================== */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            aria-label="Закрыть уведомление"
            className="ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ШАПКА СТРАНИЦЫ (print:hidden)                                       */}
      {/* ==================================================================== */}
      <header className="mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Отчётно-аналитические формы
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              ЦБУ №406 в г. Пинск • ОАО «Белинвестбанк» • Реестр факторингового портфеля
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm self-start sm:self-auto">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Система факторингового учёта v2.4</span>
          </div>
        </div>

        {/* Кнопка аккордеона на мобильных (< lg) */}
        <div className="mt-4 lg:hidden">
          <button
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm min-h-[44px]"
            aria-expanded={isAccordionOpen}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              Параметры формирования ({reportTitleMap[reportType]})
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                isAccordionOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* ОСНОВНОЙ ДВУХКОЛОНОЧНЫЙ МАКЕТ                                         */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* ================================================================== */}
        {/* ЛЕВАЯ КОЛОНКА: ПАНЕЛЬ ПАРАМЕТРОВ                                   */}
        {/* ================================================================== */}
        <aside
          className={`space-y-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm print:hidden lg:sticky lg:top-6 transition-all duration-200 ${
            isAccordionOpen ? 'block' : 'hidden lg:block'
          }`}
          aria-label="Параметры генерации отчёта"
        >
          {/* СЕКЦИЯ 1: ТИП ДОКУМЕНТА */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-semibold text-slate-800">
                Тип документа
              </span>
              <span className="text-xs text-slate-500 font-normal">Шаблон</span>
            </div>

            <div role="radiogroup" aria-label="Тип документа" className="space-y-2">
              {[
                {
                  id: 'RECONCILIATION' as ReportType,
                  title: 'Акт сверки операций',
                  subtitle: 'Движение ТТН и лимитов',
                  icon: ClipboardCheck,
                },
                {
                  id: 'OVERDUE' as ReportType,
                  title: 'Ведомость просрочки',
                  subtitle: 'Aging report и начисление пени',
                  icon: AlertTriangle,
                },
                {
                  id: 'REVENUE' as ReportType,
                  title: 'Сводный реестр доходов',
                  subtitle: 'Комиссионный дисконт ЦБУ',
                  icon: PieChart,
                },
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
                    className={`w-full min-h-[52px] p-3 rounded-lg border text-left transition-all relative flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm border-[2px]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pr-6">
                      <span className="text-sm font-semibold text-slate-900 block leading-tight">
                        {item.title}
                      </span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {item.subtitle}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* СЕКЦИЯ 2: ПЕРИОД */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-800">Период</span>
              <span className="text-xs text-slate-500 font-mono">2026</span>
            </div>

            {/* Сегментированный контрол */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
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
                  className={`py-2 px-1 rounded-md font-semibold transition-all text-center min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    period === p.id
                      ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Произвольный выбор дат */}
            {period === 'CUSTOM' && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Интервал формирования:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">С даты</label>
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">По дату</label>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* СЕКЦИЯ 3: КОНТРАГЕНТ (МАСШТАБИРУЕМЫЙ ВЫПАДАЮЩИЙ СПИСОК С ПОИСКОМ) */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-slate-800">
                Контрагент (Клиент)
              </span>
              <span className="text-xs text-slate-500">УНП 9 цифр</span>
            </div>

            <button
              type="button"
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-left shadow-xs hover:border-slate-300 min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={isClientDropdownOpen}
            >
              <div className="truncate pr-2">
                <span className="font-semibold text-slate-900 block truncate">
                  {MOCK_CLIENTS.find((c) => c.id === selectedClientId)?.name}
                </span>
                <span className="text-xs text-slate-500 font-mono block">
                  УНП: {MOCK_CLIENTS.find((c) => c.id === selectedClientId)?.unp}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                  isClientDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                }`}
              />
            </button>

            {/* Выпадающее меню с поисковой строкой */}
            {isClientDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск по названию или УНП..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div
                  role="listbox"
                  className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100"
                >
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 font-medium">
                      Контрагенты не найдены
                    </div>
                  ) : (
                    filteredClients.map((client) => {
                      const isSelected = selectedClientId === client.id;
                      return (
                        <button
                          key={client.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setIsClientDropdownOpen(false);
                            setClientSearch('');
                          }}
                          className={`w-full text-left p-2 rounded-md transition-colors flex items-center justify-between text-xs min-h-[38px] ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="block truncate font-medium">{client.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              УНП {client.unp}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* КНОПКА ГЕНЕРАЦИИ (PRIMARY НА ВСЮ ШИРИНУ) */}
          <div className="pt-2">
            <button
              type="button"
              disabled={screenState === 'loading'}
              onClick={handleGenerate}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg shadow-sm shadow-emerald-700/20 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {screenState === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Формирование проводок...</span>
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

        {/* ================================================================== */}
        {/* ПРАВАЯ КОЛОНКА: ТУЛБАР И ПРЕДПРОСМОТР ДОКУМЕНТА (А4)              */}
        {/* ================================================================== */}
        <main className="space-y-4 min-w-0">
          {/* ТУЛБАР НАД ДОКУМЕНТОМ (print:hidden) */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            {/* Чипы применённых параметров */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Применено:
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                {activeClient.name.split(' ')[1] || activeClient.name}
              </span>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 font-medium px-2.5 py-1 rounded-md">
                {periodLabelMap[appliedParams.period]}
              </span>
              <span className="bg-slate-100 text-slate-700 border border-slate-200 font-medium px-2.5 py-1 rounded-md">
                {reportTitleMap[appliedParams.reportType]}
              </span>
            </div>

            {/* Кнопки действий с документом */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[40px] px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Печать документа или экспорт в PDF"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Печать / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setToastMessage('Выгрузка Excel (.xlsx) успешно инициирована')}
                className="min-h-[40px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Экспорт ведомости в Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Экспорт Excel</span>
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* ГРАФИК АНАЛИЗА ТТН (print:hidden)                                */}
          {/* ================================================================ */}
          {screenState === 'success' && activeInvoices.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm print:hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Соотношение: Сумма уступки vs Аванс (80%) vs Дисконт банка
                </span>
                <span className="text-xs text-slate-500">По накладным</span>
              </div>
              <div
                className="h-44 w-full"
                role="region"
                aria-label="График распределения сумм по накладным"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={invoicesChartData}
                    margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: BRAND.slate[500], fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: BRAND.slate[500], fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: BRAND.slate[900],
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [formatBYN(val), '']}
                    />
                    <Bar
                      name="Сумма уступки"
                      dataKey="amount"
                      fill={BRAND.slate[500]}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Аванс банка"
                      dataKey="advance"
                      fill={BRAND.emerald[600]}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Дисконт (комиссия)"
                      dataKey="fee"
                      fill={BRAND.amber[600]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* ЭКРАННЫЕ СОСТОЯНИЯ: LOADING / EMPTY / ERROR / ДОКУМЕНТ           */}
          {/* ================================================================ */}
          {screenState === 'loading' && (
            <div className="bg-white border border-slate-200 rounded-xl p-10 shadow-sm text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-800">
                  Формирование финансового реестра
                </p>
                <p className="text-xs text-slate-500">
                  Сверка кредитных лимитов, расчёт дисконта и проверка электронных подписей...
                </p>
              </div>
              {/* Скелетон таблицы */}
              <div className="max-w-2xl mx-auto space-y-2 pt-4">
                <div className="h-6 bg-slate-100 rounded-md animate-pulse" />
                <div className="h-8 bg-slate-100 rounded-md animate-pulse" />
                <div className="h-8 bg-slate-100 rounded-md animate-pulse" />
                <div className="h-8 bg-slate-100 rounded-md animate-pulse" />
              </div>
            </div>
          )}

          {screenState === 'empty' && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <FileX className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-800">
                За выбранный период операции не зарегистрированы
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                По контрагенту {activeClient.name} отсутствуют уступленные денежные
                требования. Измените диапазон дат или выберите другого клиента.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedClientId('kuzlitmash');
                  handleGenerate();
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Сбросить на ОАО «Кузлитмаш»
              </button>
            </div>
          )}

          {screenState === 'error' && (
            <div className="bg-white border border-rose-200 rounded-xl p-10 text-center shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-900">
                Ошибка построения банковского документа
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Не удалось связаться с модулем расчёта процентов факторингового шлюза ЦБУ.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Повторить запрос
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* ОФИЦИАЛЬНЫЙ ЛИСТ А4 (ПРЕДПРОСМОТР ДОКУМЕНТА)                     */}
          {/* ================================================================ */}
          {screenState === 'success' && (
            <article
              id="factoring-document-sheet"
              aria-label="Официальный бланк документа"
              className="bg-white border border-slate-200 shadow-md rounded-xl p-6 sm:p-10 lg:p-12 max-w-[794px] mx-auto text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:rounded-none"
            >
              {/* ШАПКА БАНКА И СТАТУС ЭЦП */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b-2 border-slate-900 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                      ОАО «Белинвестбанк»
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded">
                      ЦБУ №406
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Центр банковских услуг №406, г. Пинск, ул. Завальная, 15
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    УНП: 807000028 • БИК (BIC): BLBBY2X • ОКПО: 09801244
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ЭЦП валидна (КриптоПро)</span>
                  </div>
                  <span className="text-xs text-slate-500 block font-medium">
                    Дата выгрузки: <span className="font-mono text-slate-700">{appliedParams.generatedAt}</span>
                  </span>
                </div>
              </div>

              {/* ЗАГОЛОВОК ДОКУМЕНТА */}
              <div className="text-center my-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight uppercase">
                  {reportTitleMap[appliedParams.reportType]}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  по генеральному договору факторинга с клиентом{' '}
                  <span className="font-bold text-slate-900">{activeClient.name}</span>
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  УНП: {activeClient.unp} • Р/с: {activeClient.iban} • Период: {periodLabelMap[appliedParams.period]}
                </p>
              </div>

              {/* ТАБЛИЦА ТТН */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
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
                    {activeInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {inv.number}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {inv.debtor}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatBYN(inv.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                          {formatBYN(inv.advance)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          {formatBYN(inv.fee)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {inv.status === 'Financed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Профинансировано
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              На рассмотрении
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* СТРОКА ИТОГО */}
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td colSpan={2} className="py-3 px-3 uppercase text-xs tracking-wider text-slate-700">
                        Итого по акту:
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-sm font-bold text-slate-900">
                        {formatBYN(totals.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-sm font-bold text-emerald-700">
                        {formatBYN(totals.totalAdvance)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-sm font-bold text-slate-900">
                        {formatBYN(totals.totalFee)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ============================================================ */}
              {/* ИТОГОВЫЙ БЛОК ЛИМИТОВ И ИХ УТИЛИЗАЦИИ ВНУТРИ ДОКУМЕНТА       */}
              {/* ============================================================ */}
              <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Левая сторона: ключевые цифры лимита */}
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                      Утверждённый кредитный лимит
                    </span>
                    <span className="text-xl font-bold text-slate-900 font-mono tabular-nums block">
                      {formatBYN(activeClient.factoringLimit)}
                    </span>
                  </div>

                  {/* Правая сторона: свободный остаток */}
                  <div className="sm:text-right space-y-1">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                      Свободный остаток лимита
                    </span>
                    <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums block">
                      {formatBYN(totals.freeLimit)}
                    </span>
                  </div>
                </div>

                {/* Горизонтальный BarChart лимита (Recharts) */}
                <div
                  className="space-y-1 pt-1 print:hidden"
                  role="region"
                  aria-label="График использования лимита"
                >
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>
                      Использовано: <strong>{formatBYN(activeClient.usedLimit)}</strong>
                    </span>
                    <span>
                      Свободно: <strong>{formatBYN(totals.freeLimit)}</strong>
                    </span>
                  </div>
                  <div className="h-6 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={limitChartData}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" hide domain={[0, activeClient.factoringLimit]} />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: BRAND.slate[900],
                            borderRadius: '8px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          formatter={(v: any) => [formatBYN(v), '']}
                        />
                        <Bar dataKey="used" stackId="limit" fill={BRAND.emerald[600]} radius={[4, 0, 0, 4]} />
                        <Bar dataKey="available" stackId="limit" fill={BRAND.slate[200]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* БЛОК ПОДПИСЕЙ И ПЕЧАТЕЙ */}
              <div className="mt-12 pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-700">
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      От ОАО «Белинвестбанк» (ЦБУ №406):
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Специалист сектора корпоративного факторинга
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <div className="w-36 border-b border-slate-400" />
                    <span className="font-mono text-slate-600">/ Е. В. Козема /</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Подписано квалифицированной ЭЦП
                  </span>
                </div>

                <div className="space-y-4 sm:text-right">
                  <div>
                    <p className="font-semibold text-slate-900">
                      От Клиента ({activeClient.name}):
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Руководитель / Главный бухгалтер
                    </p>
                  </div>
                  <div className="flex items-center sm:justify-end gap-2 pt-4">
                    <div className="w-36 border-b border-slate-400" />
                    <span className="font-mono text-slate-600">/ ____________ /</span>
                  </div>
                  <div className="inline-block border border-dashed border-slate-300 rounded-md px-3 py-1 text-[11px] text-slate-400">
                    М.П. (Место печати)
                  </div>
                </div>
              </div>

              {/* ЮРИДИЧЕСКИЙ ФУТЕР БЛАНКА */}
              <footer className="mt-8 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
                Акт сформирован автоматически в АС «Факторинг-Онлайн» ОАО «Белинвестбанк».
                Документ имеет юридическую силу электронного документа в соответствии с Законом РБ № 113-З.
              </footer>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}