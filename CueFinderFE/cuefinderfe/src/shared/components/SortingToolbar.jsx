import React from 'react';
import { Button } from '../../components/ui/button.jsx';

/**
 * SortingToolbar - Reusable sorting toolbar component
 * Used in both desktop and mobile views
 *
 * @component
 * @param {Array<{value: string, label: string}>} options - Sort options
 * @param {string} currentSort - Currently selected sort option
 * @param {Function} onSortChange - Callback when sort changes
 * @param {boolean} [isMobile=false] - Show compact mobile layout
 *
 * @example
 * <SortingToolbar
 *   options={[
 *     { value: 'name', label: 'Name' },
 *     { value: 'recent', label: 'Recent' }
 *   ]}
 *   currentSort="name"
 *   onSortChange={setSortBy}
 *   isMobile={true}
 * />
 */
export default function SortingToolbar({
  options,
  currentSort,
  onSortChange,
  isMobile = false,
}) {
  if (isMobile) {
    return (
      <div className="md:hidden bg-slate-800/95 border border-purple-500/20 px-4 py-3 rounded-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-400">Sort:</span>
          <div className="flex gap-2 flex-wrap">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  currentSort === option.value
                    ? 'bg-purple-600/40 border border-purple-500/50 text-purple-200'
                    : 'bg-purple-600/10 border border-purple-500/20 text-purple-300 hover:bg-purple-600/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex gap-2 items-center">
      <span className="text-sm font-semibold text-slate-400">Sort by:</span>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={currentSort === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
