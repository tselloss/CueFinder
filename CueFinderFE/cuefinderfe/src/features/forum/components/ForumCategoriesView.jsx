import React from 'react';
import CategoryCard from './CategoryCard';

/**
 * ForumCategoriesView - Displays all forum categories
 * @component
 * @param {Array} categories - Array of category objects
 * @param {Function} onCategorySelect - Callback when category is selected
 * @param {string} sortBy - Current sort order ('name', 'discussions', 'recent')
 * @param {Function} onSortChange - Callback to change sort order
 */
export default function ForumCategoriesView({
  categories,
  onCategorySelect,
  sortBy,
  onSortChange,
}) {
  const sortedCategories = [...categories].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'discussions') return (b.discussionCount || 0) - (a.discussionCount || 0);
    if (sortBy === 'recent') return new Date(b.modifiedAt || b.createdAt) - new Date(a.modifiedAt || a.createdAt);
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-1 h-7 bg-gradient-to-b from-purple-600 to-purple-700 rounded-full shadow-lg" />
        <h2 className="text-2xl font-bold text-purple-400">Forum Categories</h2>
        <span className="text-xs text-slate-500">• Choose a category</span>
      </div>

      {/* Mobile Sorting Toolbar */}
      <div className="md:hidden bg-slate-800/95 border border-purple-500/20 px-4 py-3 rounded-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-400">Sort by:</span>
          <div className="flex gap-2">
            {['name', 'discussions', 'recent'].map((option) => (
              <button
                key={option}
                onClick={() => onSortChange(option)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === option
                    ? 'bg-purple-600/40 border border-purple-500/50 text-purple-200'
                    : 'bg-purple-600/10 border border-purple-500/20 text-purple-300 hover:bg-purple-600/20'
                }`}
              >
                {option === 'discussions' ? 'Most Active' : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max max-h-[calc(100vh-280px)] overflow-auto">
        {sortedCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onSelect={() => onCategorySelect(category)}
          />
        ))}
      </div>
    </div>
  );
}
