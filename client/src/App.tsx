import { useState } from 'react';
import { Sidebar } from './components/Sidebar';

export default function App() {
  // Храним в стейте, какая вкладка сейчас выбрана
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Левая колонка: Наш сайдбар */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Правая колонка: Рабочая зона */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Активная вкладка: <span className="text-bank-600 capitalize">{activeTab}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Кликай по пунктам меню слева — стейт уже работает!
        </p>
      </main>
    </div>
  );
}