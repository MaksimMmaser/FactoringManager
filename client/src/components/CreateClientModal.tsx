import React, { useState } from 'react';
import { Modal } from './Modal';
import { Building, ShieldCheck, AlertCircle, Check, Loader2 } from 'lucide-react';
// import type { ClientItem } from '../types/dashboard';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (clientData: any) => Promise<void> | void; // Поддерживаем асинхронный сабмит
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
}) => {
  const [name, setName] = useState('');
  const [unp, setUnp] = useState('');
  const [iban, setIban] = useState('BY88BLBB30120000241510001001');
  const [limit, setLimit] = useState(50000);
  const [rating, setRating] = useState<'A' | 'B' | 'C'>('A');
  
  // 🎯 Промышленная обработка ошибок и загрузки прямо в форме
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
      setErrorMessage('УНП юридического лица в РБ должен содержать ровно 9 цифр!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Отправляем данные на бэкенд. Если сервер вернет ошибку (400, 409, 500), мы пойдем в catch!
      await onAddClient({
        name: name.trim(),
        unp: unp.trim(),
        iban: iban.trim().toUpperCase(),
        factoringLimit: Number(limit),
        rating,
      });

      // Успех: закрываем модалку и сбрасываем форму
      setIsSubmitting(false);
      onClose();
      setName('');
      setUnp('');
    } catch (err: any) {
      // 🎯 Ошибка поймана! Форма НЕ стерлась, пользователь видит причину
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Не удалось зарегистрировать клиента на сервере.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Регистрация нового клиента (Поставщика)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Интерактивная плашка ошибки (вместо убогого alert) */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-in fade-in">
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
            Наименование предприятия
          </label>
          <div className="relative">
            <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="например, ОАО «Кузлитмаш»"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* УНП */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            УНП (9 цифр РБ)
          </label>
          <input
            type="text"
            required
            disabled={isSubmitting}
            placeholder="200024151"
            value={unp}
            onChange={(e) => handleUnpChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 disabled:opacity-50"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Введено: {unp.length}/9 цифр
          </span>
        </div>

        {/* Рейтинг (Segmented Control) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Рейтинг кредитоспособности (Оценка рисков ЦБУ)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['A', 'B', 'C'] as const).map((r) => {
              const isSelected = rating === r;
              const titleMap = { A: 'Класс A', B: 'Класс B', C: 'Класс C' };
              const descMap = { A: 'Высокая надежность', B: 'Умеренный риск', C: 'Особый контроль' };
              const colorMap = {
                A: 'border-emerald-500 bg-emerald-50/80 text-emerald-900',
                B: 'border-amber-500 bg-amber-50/80 text-amber-900',
                C: 'border-rose-500 bg-rose-50/80 text-rose-900',
              };

              return (
                <button
                  key={r}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setRating(r)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? `${colorMap[r]} ring-2 ring-offset-1 shadow-sm font-bold`
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs block">{titleMap[r]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] opacity-75 block mt-0.5">{descMap[r]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* IBAN */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Расчетный счет IBAN
          </label>
          <input
            type="text"
            required
            disabled={isSubmitting}
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-bank-500 disabled:opacity-50"
          />
        </div>

        {/* Лимит */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Утвержденный лимит факторинга (BYN)
          </label>
          <input
            type="number"
            min="1000"
            step="1000"
            required
            disabled={isSubmitting}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-bank-600 focus:outline-none focus:border-bank-500 disabled:opacity-50"
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-bank-600 shrink-0" />
          <span>Клиент регистрируется в кредитном регистре филиала ЦБУ №406</span>
        </div>

        {/* Кнопки */}
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
            <span>{isSubmitting ? 'Сохранение в БД...' : 'Зарегистрировать клиента'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};