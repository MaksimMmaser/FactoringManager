import React, { useState } from 'react';
import { Modal } from './Modal';
import { Building, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import type { ClientItem } from '../types/dashboard';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (newClient: ClientItem) => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
}) => {
  const [name, setName] = useState('');
  const [unp, setUnp] = useState('');
  const [iban, setIban] = useState('BY88BLBB3012');
  const [limit, setLimit] = useState(50000);
  const [rating, setRating] = useState<'A' | 'B' | 'C'>('A');
  const [error, setError] = useState<string | null>(null);

  // Валидация УНП: строго только цифры, максимум 9 знаков
  const handleUnpChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length <= 9) {
      setUnp(digitsOnly);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (unp.length !== 9) {
      setError('УНП юридического лица в РБ должен содержать ровно 9 цифр!');
      return;
    }

    const newClient: ClientItem = {
      id: crypto.randomUUID(),
      name,
      unp,
      iban,
      factoringLimit: Number(limit),
      usedLimit: 0,
      rating,
      activeContractsCount: 1,
    };

    onAddClient(newClient);
    onClose();
    setName('');
    setUnp('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Регистрация нового клиента (Поставщика)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        {/* 1. Наименование */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Наименование предприятия
          </label>
          <div className="relative">
            <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              placeholder="например, ОАО «Кузлитмаш»"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500"
            />
          </div>
        </div>

        {/* 2. УНП */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            УНП (9 цифр РБ)
          </label>
          <input
            type="text"
            required
            placeholder="200024151"
            value={unp}
            onChange={(e) => handleUnpChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Введено: {unp.length}/9 цифр
          </span>
        </div>

        {/* 🎯 3. ВМЕСТО УРОДСКОГО ВЫПАДАЮЩЕГО СПИСКА — СТИЛЬНЫЙ SEGMENTED CONTROL */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Рейтинг кредитоспособности (Оценка рисков ЦБУ)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Вариант А */}
            <button
              type="button"
              onClick={() => setRating('A')}
              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                rating === 'A'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black block">Класс A</span>
                {rating === 'A' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Высокая надежность
              </span>
            </button>

            {/* Вариант B */}
            <button
              type="button"
              onClick={() => setRating('B')}
              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                rating === 'B'
                  ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 text-amber-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black block">Класс B</span>
                {rating === 'B' && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Умеренный риск
              </span>
            </button>

            {/* Вариант C */}
            <button
              type="button"
              onClick={() => setRating('C')}
              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                rating === 'C'
                  ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 text-rose-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black block">Класс C</span>
                {rating === 'C' && <Check className="w-3.5 h-3.5 text-rose-600" />}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Особый контроль
              </span>
            </button>
          </div>
        </div>

        {/* 4. Расчетный счет IBAN */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Расчетный счет IBAN
          </label>
          <input
            type="text"
            required
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-bank-500"
          />
        </div>

        {/* 5. Лимит */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Утвержденный лимит факторинга (BYN)
          </label>
          <input
            type="number"
            min="1000"
            step="1000"
            required
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-bank-600 focus:outline-none focus:border-bank-500"
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
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-bank-600 hover:bg-bank-700 shadow-md shadow-bank-600/20 transition-all active:scale-95"
          >
            Зарегистрировать клиента
          </button>
        </div>
      </form>
    </Modal>
  );
};