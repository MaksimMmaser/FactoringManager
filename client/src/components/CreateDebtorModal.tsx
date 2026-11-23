import React, { useState } from 'react';
import { Modal } from './Modal';
import { Building2, AlertCircle, Check, ShieldCheck, Loader2 } from 'lucide-react';
import type { DebtorRiskCategory } from '../types/dashboard';

interface CreateDebtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDebtor: (debtorData: {
    name: string;
    unp: string;
    subLimit: number;
    averagePaymentDays: number;
    riskCategory: DebtorRiskCategory;
  }) => Promise<void> | void;
}

export const CreateDebtorModal: React.FC<CreateDebtorModalProps> = ({
  isOpen,
  onClose,
  onAddDebtor,
}) => {
  const [name, setName] = useState('');
  const [unp, setUnp] = useState('');
  const [subLimit, setSubLimit] = useState(25000);
  const [paymentDays, setPaymentDays] = useState(45);
  const [riskCategory, setRiskCategory] = useState<DebtorRiskCategory>('Reliable');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnpChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length <= 9) {
      setUnp(digitsOnly);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (unp.length !== 9) {
      setErrorMessage('УНП дебитора в РБ должен содержать ровно 9 цифр!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddDebtor({
        name: name.trim(),
        unp: unp.trim(),
        subLimit: Number(subLimit),
        averagePaymentDays: Number(paymentDays),
        riskCategory,
      });

      setIsSubmitting(false);
      onClose();
      setName('');
      setUnp('');
    } catch (err: unknown) {
      // 🎯 Ошибка от бэкенда (например, 409 дубликат УНП) показывается прямо здесь, форма НЕ стирается!
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Ошибка регистрации дебитора на сервере.';
      setErrorMessage(msg);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Регистрация дебитора (Покупателя)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">Ошибка сервера:</strong>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Наименование */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Наименование предприятия-дебитора
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="например, ЗАО «Холдинговая компания «Пинскдрев»"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* УНП и Срок оплаты */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              УНП (9 цифр)
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="200000123"
              value={unp}
              onChange={(e) => handleUnpChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-bank-500 disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Введено: {unp.length}/9 цифр
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Срок отсрочки (дней)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              required
              disabled={isSubmitting}
              value={paymentDays}
              onChange={(e) => setPaymentDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-bank-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Кредитный сублимит */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Максимальный сублимит риска (BYN)
          </label>
          <input
            type="number"
            min="1000"
            step="1000"
            required
            disabled={isSubmitting}
            value={subLimit}
            onChange={(e) => setSubLimit(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-bank-600 focus:outline-none focus:border-bank-500 disabled:opacity-50"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Максимальный объем задолженности, одобряемый на этого дебитора
          </span>
        </div>

        {/* Категория риска */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Категория кредитного риска
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setRiskCategory('Reliable')}
              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                riskCategory === 'Reliable'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black block">Надежный</span>
                {riskCategory === 'Reliable' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Без ограничений</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setRiskCategory('UnderControl')}
              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                riskCategory === 'UnderControl'
                  ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 text-amber-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black block">Контроль</span>
                {riskCategory === 'UnderControl' && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Задержки до 10 дн.</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setRiskCategory('StopList')}
              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                riskCategory === 'StopList'
                  ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 text-rose-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black block">Стоп-лист</span>
                {riskCategory === 'StopList' && <Check className="w-3.5 h-3.5 text-rose-600" />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Закрыт</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-bank-600 shrink-0" />
          <span>Дебитор проверяется по межбанковской базе неплательщиков г. Пинск</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-bank-600 hover:bg-bank-700 disabled:bg-slate-300 shadow-md shadow-bank-600/20 transition-all active:scale-95"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmitting ? 'Сохранение...' : 'Утвердить дебитора'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};