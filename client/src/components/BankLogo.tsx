import React, { useId } from 'react';

interface BankLogoProps {
  className?: string;
}

export const BankLogo: React.FC<BankLogoProps> = ({ className = 'w-10 h-10' }) => {
  const id = useId();
  const bgGradId = `${id}-bg`;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Логотип ЮЕ — АС Факторинг"
    >
      <defs>
        {/* Строгий глубокий банковский градиент без размытых бликов */}
        <linearGradient
          id={bgGradId}
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
      </defs>

      {/* Острая архитектурная плашка */}
      <rect width="40" height="40" rx="9" fill={`url(#${bgGradId})`} />

      {/* Тонкая резкая рамка-контур */}
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="8.5"
        stroke="#10b981"
        strokeOpacity="0.4"
        strokeWidth="1"
      />

      {/* МОНОГРАММА «Ю» (жёсткая геометрия 3px, 45° фаски, чистый белый) */}
      <rect x="6" y="10" width="3" height="20" fill="#FFFFFF" />
      <rect x="9" y="18.5" width="3" height="3" fill="#FFFFFF" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 10H19L21 12V28L19 30H14L12 28V12L14 10ZM15 13V27H18V13H15Z"
        fill="#FFFFFF"
      />

      {/* МОНОГРАММА «Е» (острые 90° грани + изумрудный акцент) */}
      <path
        d="M24 10H34V13H27V27H34V30H24V10Z"
        fill="#FFFFFF"
      />
      <rect x="27" y="18.5" width="6" height="3" fill="#34d399" />
    </svg>
  );
};