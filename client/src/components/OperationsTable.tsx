import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { RecentOperation, OperationStatus } from '../types/dashboard';

interface OperationsTableProps {
  operations: RecentOperation[];
}

export const OperationsTable: React.FC<OperationsTableProps> = ({ operations }) => {
  const formatMoney = (val: number) => 
    new Intl.NumberFormat('ru-RU').format(val) + ' BYN';

  const renderBadge = (status: OperationStatus) => {
    switch (status) {
      case 'Financed':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">Профинансировано</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">На рассмотрении</span>;
      case 'Paid':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">Погашено</span>;
      case 'Overdue':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold">Просрочено</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 flex items-center justify-between border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
            Последние операции
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Журнал проводок по уступке денежных требований</p>
        </div>
        <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-bank-500/20">
          <option>Все операции</option>
          <option>Только выплаты аванса</option>
          <option>Только поступления от дебиторов</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/75 text-[11px] text-slate-400 uppercase font-bold border-b border-slate-100">
            <tr>
              <th className="py-3.5 px-6">Дата</th>
              <th className="py-3.5 px-6">Контрагент / Клиент</th>
              <th className="py-3.5 px-6 text-right">Сумма финансирования</th>
              <th className="py-3.5 px-6 text-center">Статус</th>
              <th className="py-3.5 px-6 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {operations.map((op) => (
              <tr key={op.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{op.date}</td>
                <td className="py-4 px-6 font-semibold text-slate-800">{op.counterparty}</td>
                <td className="py-4 px-6 text-right font-extrabold text-slate-900 whitespace-nowrap">{formatMoney(op.amount)}</td>
                <td className="py-4 px-6 text-center">{renderBadge(op.status)}</td>
                <td className="py-4 px-6 text-right">
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};