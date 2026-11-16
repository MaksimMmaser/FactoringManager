import React, { useState } from 'react';
import { Modal } from './Modal';
import { ShieldCheck } from 'lucide-react';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Функция, которая получит созданный договор
  onCreate: (contractData: any) => void;
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate 
}) => {
  // Локальное состояние полей формы
  const [contractNumber, setContractNumber] = useState('ФАКТ-2026/');
  const [clientName, setClientName] = useState('ОАО «Кузлитмаш»');
  const [advanceRate, setAdvanceRate] = useState(80);
  const [factoringType, setFactoringType] = useState('WithRecourse');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Предотвращаем стандартную перезагрузку страницы браузером

    // Собираем объект
    const newContract = {
      id: crypto.randomUUID(),
      contractNumber,
      clientName,
      advanceRate: advanceRate / 100,
      factoringType,
      createdAt: new Date().toLocaleDateString('ru-RU'),
    };

    onCreate(newContract);
    onClose(); // Закрываем попап
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новый договор факторинга">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Номер договора */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Номер договора
          </label>
          <input 
            type="text"
            required
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all"
          />
        </div>

        {/* 2. Клиент (Поставщик) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Клиент (Поставщик г. Пинск)
          </label>
          <select 
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all"
          >
            <option value="ОАО «Кузлитмаш»">ОАО «Кузлитмаш» (УНП 200024151)</option>
            <option value="ОАО «Полесье»">ОАО «Полесье» (УНП 200000456)</option>
            <option value="ЗАО «Пинскдрев»">ЗАО «Пинскдрев» (УНП 200000123)</option>
          </select>
        </div>

        {/* 3. Вид факторинга */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Тип факторинга
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFactoringType('WithRecourse')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                factoringType === 'WithRecourse'
                  ? 'border-bank-600 bg-bank-50 text-bank-800 ring-2 ring-bank-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              С регрессом
              <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                Риск неплатежа несет Поставщик
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFactoringType('WithoutRecourse')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                factoringType === 'WithoutRecourse'
                  ? 'border-bank-600 bg-bank-50 text-bank-800 ring-2 ring-bank-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Без регресса
              <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                Риск неплатежа берет Банк
              </span>
            </button>
          </div>
        </div>

        {/* 4. Процент авансирования */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Размер авансового платежа
            </label>
            <span className="text-sm font-black text-bank-600">{advanceRate}%</span>
          </div>
          <input 
            type="range"
            min="50"
            max="95"
            step="5"
            value={advanceRate}
            onChange={(e) => setAdvanceRate(Number(e.target.value))}
            className="w-full accent-bank-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
            <span>50% (Минимум)</span>
            <span>80% (Стандарт ЦБУ)</span>
            <span>95% (Максимум)</span>
          </div>
        </div>

        {/* Информационная плашка банка */}
        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-bank-600 shrink-0 mt-0.5" />
          <span>Лимит финансирования будет согласован на кредитном комитете ЦБУ №406.</span>
        </div>

        {/* Кнопки действий */}
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
            Утвердить договор
          </button>
        </div>
      </form>
    </Modal>
  );
};