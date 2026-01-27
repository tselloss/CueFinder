import React from 'react';

export default function AdminTabs({ activeTab, onTabChange }) {
  const tabs = ['all', 'cues', 'cases'];

  return (
    <div className="mb-4 border-b border-gray-200">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-0 font-medium text-xs sm:text-sm border-b-2 transition-colors touch-manipulation ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
