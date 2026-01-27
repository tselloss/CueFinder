import React from 'react';

/**
 * CategoryCard - Individual category card component
 * @component
 * @param {Object} category - Category data
 * @param {Function} onSelect - Callback when category is selected
 */
export default function CategoryCard({ category, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className="cursor-pointer p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/25 rounded-xl hover:border-purple-500/60 hover:-translate-y-1 transition-all shadow-md hover:shadow-xl hover:shadow-purple-500/20 relative overflow-hidden group"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 shadow-md" />

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h3 className="text-base font-bold text-purple-300">{category.name}</h3>
          </div>
          <div className="px-2 py-1 bg-purple-500/20 rounded text-xs font-bold text-purple-300">
            {category.discussionCount || 0}
          </div>
        </div>
        <p className="text-sm text-slate-400 line-clamp-2">{category.description}</p>
        <div className="flex justify-between items-center mt-3 p-2 bg-purple-500/5 rounded text-xs font-semibold border border-purple-500/15">
          <span className="text-purple-300/80">
            {category.discussionCount === 1 ? '1 discussion' : `${category.discussionCount || 0} discussions`}
          </span>
          <span className="text-purple-300">View →</span>
        </div>
      </div>
    </div>
  );
}
