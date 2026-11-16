import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Описываем, что модалка принимает на вход
interface ModalProps {
  isOpen: boolean;                // Открыто окно или закрыто
  onClose: () => void;            // Функция, которая сработает при закрытии
  title: string;                  // Заголовок попапа
  children: React.ReactNode;      // Любое содержимое внутри (форма, текст, кнопки)
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Закрытие по нажатию на клавишу Escape на клавиатуре (правило доступности UX)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Блокируем скролл страницы под модалкой
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Если окно закрыто — не рисуем ничего
  if (!isOpen) return null;

  return (
    // Темная полупрозрачная подложка на весь экран
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {/* Клик по фону закрывает модалку */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Само белое всплывающее окно */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 z-10 overflow-hidden transform transition-all scale-100">
        {/* Шапка модалки */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое формы */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};