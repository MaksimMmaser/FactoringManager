import React, { useState } from 'react';
import { Modal } from './Modal';
import { Lock, UserCheck, Shield, KeyRound, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: string;
  onLogin: (user: { name: string; role: string; login: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onLogin,
}) => {
  const [login, setLogin] = useState('officer-406');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<'OFFICER' | 'ADMIN'>(
    currentRole.includes('Администратор') ? 'ADMIN' : 'OFFICER'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === 'ADMIN') {
      onLogin({
        name: 'Администратор системы',
        role: 'Администратор ЦБУ №406',
        login,
      });
    } else {
      onLogin({
        name: 'Козема Е. В.',
        role: 'Специалист по факторингу',
        login,
      });
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Авторизация сотрудника ЦБУ №406">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Выбор роли в банке (Segmented Control) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Ролевой профиль доступа
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('OFFICER')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                selectedRole === 'OFFICER'
                  ? 'border-bank-600 bg-bank-50/80 ring-2 ring-bank-500/20 text-bank-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black block">Специалист</span>
                {selectedRole === 'OFFICER' && <Check className="w-3.5 h-3.5 text-bank-600" />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Оформление сделок и ТТН
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('ADMIN')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                selectedRole === 'ADMIN'
                  ? 'border-bank-600 bg-bank-50/80 ring-2 ring-bank-500/20 text-bank-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black block">Администратор</span>
                {selectedRole === 'ADMIN' && <Check className="w-3.5 h-3.5 text-bank-600" />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Полный доступ и аудит
              </span>
            </button>
          </div>
        </div>

        {/* Логин / Табельный номер */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Табельный номер сотрудника
          </label>
          <div className="relative">
            <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500"
            />
          </div>
        </div>

        {/* Пароль */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Пароль учетной записи
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-bank-500/20 focus:border-bank-500"
            />
          </div>
        </div>

        {/* Индикатор безопасности банка */}
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
          <Shield className="w-4 h-4 text-bank-600 shrink-0" />
          <span>Канал защищен шифрованием TLS 1.3 • Домен BELINVESTBANK</span>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-bank-600 hover:bg-bank-700 shadow-md shadow-bank-600/20 transition-all active:scale-95"
          >
            <Lock className="w-3.5 h-3.5" />
            Войти в систему
          </button>
        </div>
      </form>
    </Modal>
  );
};