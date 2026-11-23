import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { ShieldCheck, ChevronDown, Check, Building2, AlertCircle, Loader2 } from 'lucide-react';
import type { ClientItem } from '../types/dashboard';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientItem[];
  onCreate: (contractData: {
    contractNumber: string;
    clientId: string;
    advanceRate: number;
    factoringType: string;
  }) => Promise<void> | void;
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({ 
  isOpen, 
  onClose, 
  clients,
  onCreate 
}) => {
  const [contractNumber, setContractNumber] = useState('ФАКТ-2026/408');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [advanceRate, setAdvanceRate] = useState(80);
  const [factoringType, setFactoringType] = useState('WithRecourse');

  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Состояния для красивой обработки ошибок и загрузки без alert()
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedClient) {
      setErrorMessage('Выберите клиента из базы!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        contractNumber: contractNumber.trim(),
        clientId: selectedClient.id,
        advanceRate: advanceRate / 100,
        factoringType,
      });

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      // 🎯 Ошибка показана прямо в модалке, форма НЕ стерлась!
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Ошибка создания договора на сервере.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новый договор факторинга">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Интерактивная плашка ошибки вместо alert() */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">Ошибка сервера:</strong>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Номер договора */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Номер договора
          </label>
          <input 
            type="text"
            required
            disabled={isSubmitting}
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 transition-all font-mono disabled:opacity-50"
          />
        </div>

        {/* Выбор клиента */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Клиент (Поставщик г. Пинск)
          </label>
          
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left transition-all focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500 min-h-[44px] disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Building2 className="w-4 h-4 text-bank-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                  {selectedClient ? selectedClient.name : 'Список клиентов пуст'}
                </span>
                {selectedClient && (
                  <span className="text-[10px] text-slate-400 font-mono block">
                    УНП {selectedClient.unp} • Лимит: {new Intl.NumberFormat('ru-RU').format(selectedClient.factoringLimit)} BYN
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isClientDropdownOpen ? 'rotate-180 text-bank-600' : ''}`} />
          </button>

          {isClientDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 max-h-56 overflow-y-auto">
              {clients.map((c) => {
                const isSelected = selectedClient?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setIsClientDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                      isSelected ? 'bg-bank-50 text-bank-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold text-slate-800">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">УНП {c.unp}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-bank-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Тип факторинга */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Тип факторинга
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setFactoringType('WithRecourse')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                factoringType === 'WithRecourse'
                  ? 'border-bank-600 bg-bank-50 text-bank-800 ring-2 ring-bank-500/20 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              С регрессом
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setFactoringType('WithoutRecourse')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                factoringType === 'WithoutRecourse'
                  ? 'border-bank-600 bg-bank-50 text-bank-800 ring-2 ring-bank-500/20 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Без регресса
            </button>
          </div>
        </div>

        {/* Размер аванса */}
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
            disabled={isSubmitting}
            value={advanceRate}
            onChange={(e) => setAdvanceRate(Number(e.target.value))}
            className="w-full accent-bank-600 cursor-pointer h-2 bg-slate-100 rounded-lg disabled:opacity-50"
          />
        </div>

        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-bank-600 shrink-0 mt-0.5" />
          <span>Договор регистрируется в кредитном регистре филиала ЦБУ №406.</span>
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
            <span>{isSubmitting ? 'Сохранение...' : 'Утвердить договор'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};