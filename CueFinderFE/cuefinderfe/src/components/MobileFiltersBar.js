import React from 'react';
import { Button } from './ui/button';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MaterialInput from './MaterialInput';

export default function MobileFiltersBar({
  search,
  setSearch,
  category,
  setCategory,
  cueType,
  setCueType,
  condition,
  setCondition,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  showMobileFilters,
  setShowMobileFilters,
  user,
  onAddListing,
  PRICE_MIN_LIMIT = 0,
  PRICE_MAX_LIMIT = 10000,
  PRICE_STEP = 1,
  currencySymbol = '€'
}) {
  const { t } = useTranslation();
  
  // Track temporary filter states before applying
  const [tempCondition, setTempCondition] = React.useState(condition);
  const [tempSortBy, setTempSortBy] = React.useState(sortBy);
  const [tempPriceRange, setTempPriceRange] = React.useState(priceRange);
  const [tempMinPrice, setTempMinPrice] = React.useState(priceRange[0]);
  const [tempMaxPrice, setTempMaxPrice] = React.useState(priceRange[1]);
  
  // Check if any filters are active
  const hasActiveFilters = condition !== 'all' || 
    sortBy !== (t('filters.sortBy.newest') || 'Newest First') ||
    priceRange[0] !== PRICE_MIN_LIMIT || priceRange[1] !== PRICE_MAX_LIMIT;
  
  // Apply filters
  const handleApplyFilters = () => {
    setCondition(tempCondition);
    setSortBy(tempSortBy);
    setPriceRange([tempMinPrice, tempMaxPrice]);
    setShowMobileFilters(false);
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    const defaultSortBy = t('filters.sortBy.newest') || 'Newest First';
    setTempCondition('all');
    setTempSortBy(defaultSortBy);
    setTempMinPrice(PRICE_MIN_LIMIT);
    setTempMaxPrice(PRICE_MAX_LIMIT);
  };
  
  // Clear all filters
  const handleClearAllFilters = () => {
    const defaultSortBy = t('filters.sortBy.newest') || 'Newest First';
    setCondition('all');
    setSortBy(defaultSortBy);
    setPriceRange([PRICE_MIN_LIMIT, PRICE_MAX_LIMIT]);
  };
  
  // Sync temp states when modal opens
  React.useEffect(() => {
    if (showMobileFilters) {
      setTempCondition(condition);
      setTempSortBy(sortBy);
      setTempMinPrice(priceRange[0]);
      setTempMaxPrice(priceRange[1]);
    }
  }, [showMobileFilters, condition, sortBy, priceRange]);

  return (
    <>
      <div
        className="mobile-filters-toolbar space-y-3 p-4 bg-gradient-to-b from-slate-900 to-slate-800 border-b-2 sticky top-60 z-100 shadow-lg"
        style={{
          borderBottomColor: 'rgba(59, 130, 246, 0.3)'
        }}
      >
        {/* Search Bar - Always Visible */}
        <div className="flex gap-2 items-center">
          <div className="flex-grow">
            <MaterialInput
              placeholder={t('filters.search') || "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              icon="search"
              style={{ width: '100%' }}
            />
          </div>
          
          {user && (
            <Button
              onClick={onAddListing}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all h-10 px-4 text-sm font-semibold flex-shrink-0"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Listing</span>
            </Button>
          )}
        </div>

        {/* Filter Toggle & Active Indicator */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm h-10 transition-colors ${
              showMobileFilters 
                ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-500'
                : 'bg-slate-800/80 border-2 border-slate-700/50 text-slate-400'
            }`}
          >
            {showMobileFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-xs font-bold">
                ●
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="p-2.5 rounded-lg h-10 transition-colors flex-shrink-0 bg-red-500/15 border-2 border-red-500/30"
            >
              <X size={18} className="text-red-400" />
            </button>
          )}
        </div>

        {/* Collapsible Filters */}
        {showMobileFilters && (
          <div 
            className="space-y-3 p-3 rounded-lg border"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderColor: 'rgba(59, 130, 246, 0.2)'
            }}
          >
            {/* Condition */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase">Condition</label>
              <select
                value={tempCondition === 'all' ? (t('filters.condition.all') || 'All') : tempCondition}
                onChange={(e) => setTempCondition(e.target.value === (t('filters.condition.all') || 'All') ? 'all' : e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 bg-slate-800 border border-blue-300 border-opacity-30 focus:outline-none focus:border-opacity-60"
              >
                <option>{t('filters.condition.all') || 'All'}</option>
                <option>{t('filters.condition.likeNew') || 'Like New'}</option>
                <option>{t('filters.condition.used') || 'Used'}</option>
                <option>{t('filters.condition.fair') || 'Fair'}</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase">Sort By</label>
              <select
                value={tempSortBy}
                onChange={(e) => setTempSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 bg-slate-800 border border-blue-300 border-opacity-30 focus:outline-none focus:border-opacity-60"
              >
                <option>{t('filters.sortBy.newest') || 'Newest'}</option>
                <option>{t('filters.sortBy.priceLow') || 'Price: Low'}</option>
                <option>{t('filters.sortBy.priceHigh') || 'Price: High'}</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase">Price Range</label>
              <div 
                className="p-3 rounded-lg space-y-3"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)'
                }}
              >
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-slate-300">
                    {currencySymbol}{tempMinPrice}
                  </span>
                  <span className="text-sm font-semibold text-slate-300">
                    {currencySymbol}{tempMaxPrice}
                  </span>
                </div>
                
                {/* Visual Range Bar */}
                <div className="h-1 rounded-full bg-slate-700 relative">
                  <div
                    className="h-1 rounded-full bg-blue-500 absolute"
                    style={{
                      width: `${((tempMaxPrice - tempMinPrice) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                      marginLeft: `${((tempMinPrice - PRICE_MIN_LIMIT) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`
                    }}
                  />
                </div>
                
                {/* Min Price Slider */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Min: {currencySymbol}{tempMinPrice}</label>
                  <input
                    type="range"
                    min={PRICE_MIN_LIMIT}
                    max={tempMaxPrice}
                    step={PRICE_STEP}
                    value={tempMinPrice}
                    onChange={(e) => {
                      const newMin = Math.min(parseInt(e.target.value), tempMaxPrice - PRICE_STEP);
                      setTempMinPrice(newMin);
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                
                {/* Max Price Slider */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Max: {currencySymbol}{tempMaxPrice}</label>
                  <input
                    type="range"
                    min={tempMinPrice}
                    max={PRICE_MAX_LIMIT}
                    step={PRICE_STEP}
                    value={tempMaxPrice}
                    onChange={(e) => {
                      const newMax = Math.max(parseInt(e.target.value), tempMinPrice + PRICE_STEP);
                      setTempMaxPrice(newMax);
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors h-10"
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  color: '#94a3b8'
                }}
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-3 py-2.5 rounded-lg text-sm font-bold text-white transition-colors h-10"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
