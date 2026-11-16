import React, { useEffect } from 'react';
import { createPortal } from 'react-dom'; // 👈 1. ИМПОРТИРУЕМ ТЕЛЕПОРТ
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 🎯 2. ТЕЛЕПОРТИРУЕМ МОДАЛКУ НАПРЯМУЮ В document.body (БЕЗ ЩЕЛЕЙ И ПРОСВЕТОВ)
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto flex min-h-screen w-screen items-center justify-center p-3 sm:p-4">
      {/* 🎯 3. Монолитная темная подложка на 100% ширины и высоты окна */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200" 
        onClick={onClose} 
      />

      {/* Белое всплывающее окно */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-auto z-10 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-white">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight pr-4">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело формы со скроллом */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {children}
        </div>
      </div>
    </div>,
    document.body // 👈 Монтируем в корень страницы!
  );
};