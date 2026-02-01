import React from 'react';
import CueCard from './CueCard';
import CueListItem from './CueListItem';

/**
 * CueGridView - Grid view for cues
 * @component
 * @param {Array} items - Array of cue items to display
 * @param {Function} onSelect - Callback when item is selected
 * @param {string} currencySymbol - Currency symbol to display
 */
export function CueGridView({ items, onSelect, currencySymbol = '€' }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {items.map((cue) => (
        <CueCard
          key={cue.id}
          cue={cue}
          onSelect={onSelect}
          currencySymbol={currencySymbol}
        />
      ))}
    </div>
  );
}

/**
 * CueListView - List view for cues
 * @component
 * @param {Array} items - Array of cue items to display
 * @param {Function} onSelect - Callback when item is selected
 * @param {string} currencySymbol - Currency symbol to display
 */
export function CueListView({ items, onSelect, currencySymbol = '€' }) {
  return (
    <div className="space-y-4">
      {items.map((cue) => (
        <CueListItem
          key={cue.id}
          cue={cue}
          onSelect={onSelect}
          currencySymbol={currencySymbol}
        />
      ))}
    </div>
  );
}
