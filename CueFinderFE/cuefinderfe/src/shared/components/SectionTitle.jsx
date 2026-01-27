import React from 'react';

/**
 * SectionTitle - Reusable section title component
 * Used in lists, sections, and views
 *
 * @component
 * @param {string} text - Title text
 * @param {React.ReactNode} [icon] - Optional icon/decoration
 * @param {string} [color='purple'] - Color scheme ('purple', 'blue', 'green')
 *
 * @example
 * <SectionTitle text="Forum Categories" />
 * <SectionTitle text="Discussion Posts" color="blue" />
 */
export default function SectionTitle({ text, icon, color = 'purple' }) {
  const colorClass = {
    purple: 'from-purple-600 to-purple-700 text-purple-400',
    blue: 'from-blue-600 to-blue-700 text-blue-400',
    green: 'from-green-600 to-green-700 text-green-400',
  }[color];

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className={`w-1 h-7 bg-gradient-to-b ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} rounded-full shadow-lg`} />
      <h2 className={`text-2xl font-bold ${colorClass.split(' ')[2]}`}>{text}</h2>
      {icon && <span className="text-xs text-slate-500">{icon}</span>}
    </div>
  );
}
