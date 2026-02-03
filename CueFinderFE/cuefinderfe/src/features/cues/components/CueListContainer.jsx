import React from 'react';
import { useCueFiltering } from '../hooks/useCueFiltering';
import CueViewToggle from './CueViewToggle';
import { CueGridView, CueListView } from './CueViews';
import CueResultsInfo from './CueResultsInfo';
import HeroSearch from '../../../layout/HeroSearch';

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
  onAdd,
  query,
  search,
  setSearch,
  category,
  condition,
  setCondition,
  cueType,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  PRICE_MIN_LIMIT,
  PRICE_MAX_LIMIT,
  currencySymbol = '€',
  user,
}) {
  const searchValue = search ?? query ?? '';
  const setSearchValue = setSearch ?? (() => {});
  // Use the custom hook for filtering, sorting, and pagination
  const { filteredItems } = useCueFiltering(cues || [], {
    search: searchValue,
    category,
    condition,
    cueType,
    priceRange,
    sortBy,
  });

  return (
    <div className="w-full relative z-10">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-background via-background to-secondary/20 py-4 sm:py-6 px-2 sm:px-4 md:px-6">
        <HeroSearch
          search={searchValue}
          setSearch={setSearchValue}
          condition={condition}
          setCondition={setCondition}
          sortBy={sortBy}
          setSortBy={setSortBy}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          PRICE_MIN_LIMIT={PRICE_MIN_LIMIT}
          PRICE_MAX_LIMIT={PRICE_MAX_LIMIT}
          currencySymbol={currencySymbol}
          user={user}
          onAddListing={onAdd}
        />
      </div>

      {/* Listings Content */}
      <div className="w-full py-4 sm:py-6 px-2 sm:px-4 md:px-6 relative z-10">
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

        {/* View Mode Toggle - Bottom */}
        <div className="flex justify-center mt-6">
          <CueViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>
    </div>
  );
}
