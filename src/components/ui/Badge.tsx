import React from 'react';

interface BadgeProps {
  label: string;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}

const colorMap: Record<NonNullable<BadgeProps['color']>, string> = {
  green: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  yellow: 'bg-amber-100 text-amber-800 border border-amber-200',
  red: 'bg-red-100 text-red-700 border border-red-200',
  blue: 'bg-blue-100 text-blue-800 border border-blue-200',
  gray: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const Badge: React.FC<BadgeProps> = ({ label, color = 'gray' }) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorMap[color]}`}>
      {label}
    </span>
  );
};

export default Badge;
