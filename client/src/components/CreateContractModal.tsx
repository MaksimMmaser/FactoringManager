import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { ShieldCheck, ChevronDown, Check, Building2 } from 'lucide-react';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (contractData: any) => void;
}

interface ClientOption {
  name: string;
  unp: string;
}

const CLIENT_OPTIONS: ClientOption[] = [
  { name: 'ОАО «Кузлитмаш»', unp: '200024151' },
  { name: 'ОАО «Полесье»', unp: '200000456' },
  { name: 'ЗАО «ХК «Пинскдрев»', unp: '200000123' },
  { name: 'ОАО «Пинский мясокомбинат»', unp: '200000999' },
];

export const CreateContractModal: React.FC<CreateContractModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate 
}) => {
  const [contractNumber, setContractNumber] = useState('ФАКТ-2026/408');
  const [selectedClient, setSelectedClient] = useState<ClientOption>(CLIENT_OPTIONS[0]);
  const [advanceRate, setAdvanceRate] = useState(80);
  const [factoringType, setFactoringType] = useState('WithRecourse');

  // Кастомный селект: состояние и клик снаружи
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newContract = {
      id: crypto.randomUUID(),
      contractNumber,
      clientName: selectedClient.name,
      advanceRate: advanceRate / 100,
      factoringType,
      createdAt: new Date().toLocaleDateString('ru-RU'),
    };

    onCreate(newContract);
    onClose();
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
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all font-mono"
          />
        </div>

        {/* 🎯 2. КАСТОМНЫЙ БАНКОВСКИЙ ВЫПАДАЮЩИЙ СПИСОК ВМЕСТО SELECT */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Клиент (Поставщик г. Пинск)
          </label>
          
          <button
            type="button"
            onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left transition-all focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 min-h-[44px]"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Building2 className="w-4 h-4 text-bank-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                  {selectedClient.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  УНП {selectedClient.unp}
                </span>
              </div>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                isClientDropdownOpen ? 'rotate-180 text-bank-600' : ''
              }`} 
            />
          </button>

          {/* Меню вариантов */}
          {isClientDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {CLIENT_OPTIONS.map((opt) => {
                const isSelected = selectedClient.unp === opt.unp;
                return (
                  <button
                    key={opt.unp}
                    type="button"
                    onClick={() => {
                      setSelectedClient(opt);
                      setIsClientDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors text-xs ${
                      isSelected
                        ? 'bg-bank-50 text-bank-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold text-slate-800">{opt.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">УНП {opt.unp}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-bank-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Вид факторинга */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Тип факторинга
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setFactoringType('WithRecourse')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                factoringType === 'WithRecourse'
                  ? 'border-bank-600 bg-bank-50 text-bank-800 ring-2 ring-bank-500/20 shadow-xs'
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
                  ? 'border-bank-600 bg-bank-50 text-bank-800 ring-2 ring-bank-500/20 shadow-xs'
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
            className="w-full accent-bank-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
            <span>50% (Минимум)</span>
            <span>80% (Стандарт ЦБУ)</span>
            <span>95% (Максимум)</span>
          </div>
        </div>

        {/* Инфо-блок банка */}
        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-bank-600 shrink-0 mt-0.5" />
          <span>Лимит финансирования будет утвержден кредитным комитетом ЦБУ №406.</span>
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
            Утвердить договор
          </button>
        </div>
      </form>
    </Modal>
  );
};