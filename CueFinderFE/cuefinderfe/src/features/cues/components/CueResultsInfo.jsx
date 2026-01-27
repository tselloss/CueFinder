import React from 'react';

/**
 * CueResultsInfo - Shows cue count and filtering info
 * @component
 * @param {number} count - Number of results
 * @param {string} category - Current category filter
 */
export default function CueResultsInfo({ count, category }) {
  let categoryLabel = 'items';
  if (category === 'cases') {
    categoryLabel = 'cases';
  } else if (category === 'cues') {
    categoryLabel = 'cues';
  }

  return (
    <div className="flex justify-between items-center p-4 mt-6 border-t border-border bg-card rounded-lg">
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{count}</span>{' '}
        {categoryLabel} available
      </p>
    </div>
  );
}
