import React from 'react';

export default function AdminTabs({ activeTab, onTabChange }) {
  const tabs = ['all', 'cues', 'cases', 'tables', 'accessories'];

  return (
    <div className="mb-4 border-b border-slate-600">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-0 font-medium text-xs sm:text-sm border-b-2 transition-colors touch-manipulation whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-500 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'all' && 'All'}
            {tab === 'cues' && '🎱 Cues'}
            {tab === 'cases' && '📦 Cases'}
            {tab === 'tables' && '🎰 Tables'}
            {tab === 'accessories' && '⚙️ Accessories'}
          </button>
        ))}
      </div>
    </div>
  );
}
