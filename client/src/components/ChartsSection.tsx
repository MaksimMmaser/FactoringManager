import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import type { PortfolioPoint, TurnoverPoint } from '../types/dashboard';

interface ChartsSectionProps {
  portfolioData?: PortfolioPoint[];
  turnoverData: TurnoverPoint[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ turnoverData }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Временно закомментировано: в БД данные пока только за один месяц (1 точка)
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Динамика факторингового портфеля
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Прирост финансирования по месяцам</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">тыс. BYN</span>
        </div>
      </div>
      */}

      {/* График анализа оборачиваемости (DSO) на всю ширину */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Анализ оборачиваемости (DSO)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Средний срок погашения накладных покупателями</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">дней</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={turnoverData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="counterparty" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderRadius: '12px', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
                itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                formatter={(value: any) => [`${value} дней`, 'Срок погашения']}
                labelFormatter={(label) => `Дебитор: ${label}`}
              />
              <Bar dataKey="days" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};