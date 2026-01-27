import React from 'react';
import { useCueFiltering } from '../hooks/useCueFiltering';
import CueViewToggle from './CueViewToggle';
import { CueGridView, CueListView } from './CueViews';
import CueResultsInfo from './CueResultsInfo';

/**
 * CueListContainer - Main cue list component with filtering, sorting, and view modes
 * Replaces the old monolithic CueList component with feature-based architecture
 *
 * @component
 * @param {Object} props
 * @param {Array} props.cues - Raw cue data array
 * @param {Function} props.onSelect - Callback when cue is selected
 * @param {string} props.query - Search query text
 * @param {string} props.category - Category filter ('cues', 'cases', 'all')
 * @param {string} props.condition - Condition filter
 * @param {string} props.cueType - Cue type filter
 * @param {Array} props.priceRange - Price range [min, max]
 * @param {string} props.sortBy - Sort order
 * @param {string} props.viewMode - View mode ('grid' or 'list')
 * @param {Function} props.setViewMode - Update view mode
 * @param {string} [props.currencySymbol='€'] - Currency symbol
 *
 * @example
 * <CueListContainer
 *   cues={cues}
 *   onSelect={handleSelectCue}
 *   query={searchQuery}
 *   category="cues"
 *   condition="Mint"
 *   cueType="break"
 *   priceRange={[0, 500]}
 *   sortBy="newest"
 *   viewMode="grid"
 *   setViewMode={setViewMode}
 * />
 */
export default function CueListContainer({
  cues,
  onSelect,
  query,
  category,
  condition,
  cueType,
  priceRange,
  sortBy,
  viewMode,
  setViewMode,
  currencySymbol = '€',
}) {
  // Use the custom hook for filtering, sorting, and pagination
  const { filteredItems } = useCueFiltering(cues || [], {
    search: query,
    category,
    condition,
    cueType,
    priceRange,
    sortBy,
  });

  return (
    <div className="w-full p-4 md:p-6 relative z-10">
      {/* View Mode Toggle */}
      <CueViewToggle viewMode={viewMode} setViewMode={setViewMode} />

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <CueGridView
          items={filteredItems}
          onSelect={onSelect}
          currencySymbol={currencySymbol}
        />
      ) : (
        <CueListView
          items={filteredItems}
          onSelect={onSelect}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Results Info */}
      <CueResultsInfo count={filteredItems.length} category={category} />
    </div>
  );
}
