/**
 * SearchAndFilters - Following Nielsen Norman's Visual Design Principles
 * 
 * Applies:
 * 1. SCALE - Filter labels smaller than inputs, buttons sized for importance
 * 2. VISUAL HIERARCHY - Search > Sort > Condition > Price (by importance)
 * 3. BALANCE - Symmetric layouts, equal weight distribution
 * 4. CONTRAST - High contrast text, distinct button states, clear categories
 * 5. GESTALT PRINCIPLES - Proximity for grouping, similarity for consistency
 * 
 * Desktop: Always visible with clear hierarchy
 * Mobile: Collapsible with temporary state (Apply/Reset pattern)
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import './SearchAndFilters.css';

export default function SearchAndFilters({
  search,
  setSearch,
  condition,
  setCondition,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  PRICE_MIN_LIMIT = 0,
  PRICE_MAX_LIMIT = 10000,
  PRICE_STEP = 1,
  currencySymbol = '€'
}) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Track temporary filter states for mobile
  const [tempCondition, setTempCondition] = useState(condition);
  const [tempSortBy, setTempSortBy] = useState(sortBy);
  const [tempPriceRange, setTempPriceRange] = useState(priceRange);

  // Check if any filters are active
  const hasActiveFilters = condition !== 'all' || 
    sortBy !== (t('filters.sortBy.newest') || 'Newest First') ||
    priceRange[0] !== PRICE_MIN_LIMIT || 
    priceRange[1] !== PRICE_MAX_LIMIT;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync temp states when filters open (mobile)
  useEffect(() => {
    if (showFilters && isMobile) {
      setTempCondition(condition);
      setTempSortBy(sortBy);
      setTempPriceRange(priceRange);
    }
  }, [showFilters, isMobile, condition, sortBy, priceRange]);

  // Apply filters (mobile)
  const handleApplyFilters = () => {
    setCondition(tempCondition);
    setSortBy(tempSortBy);
    setPriceRange(tempPriceRange);
    setShowFilters(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    const defaultSortBy = t('filters.sortBy.newest') || 'Newest First';
    if (isMobile) {
      setTempCondition('all');
      setTempSortBy(defaultSortBy);
      setTempPriceRange([PRICE_MIN_LIMIT, PRICE_MAX_LIMIT]);
    } else {
      setCondition('all');
      setSortBy(defaultSortBy);
      setPriceRange([PRICE_MIN_LIMIT, PRICE_MAX_LIMIT]);
    }
  };

  // Clear all filters (mobile)
  const handleClearAllFilters = () => {
    const defaultSortBy = t('filters.sortBy.newest') || 'Newest First';
    setCondition('all');
    setSortBy(defaultSortBy);
    setPriceRange([PRICE_MIN_LIMIT, PRICE_MAX_LIMIT]);
  };

  // Desktop version - always visible
  if (!isMobile) {
    return (
      <div className="search-filters-desktop space-y-4">
        {/* Search */}
        <div className="filter-section">
          <div className="search-input-wrapper flex items-center gap-2 px-3 py-2 border border-slate-700 rounded-lg bg-slate-900/50">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder={t('filters.search') || "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input flex-1 bg-transparent outline-none text-slate-100 placeholder-slate-500"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="clear-search-btn p-1 hover:bg-slate-700/50 rounded"
              >
                <X size={16} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Condition Filter */}
        <div className="filter-section">
          <label className="filter-label text-xs font-semibold text-slate-400 mb-2 block">
            {t('filters.condition.label') || 'Condition'}
          </label>
          <select
            value={condition === 'all' ? (t('filters.condition.all') || 'All') : condition}
            onChange={(e) => setCondition(e.target.value === (t('filters.condition.all') || 'All') ? 'all' : e.target.value)}
            className="filter-select w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-900/50 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
          >
            <option>{t('filters.condition.all') || 'All'}</option>
            <option>{t('filters.condition.likeNew') || 'Like New'}</option>
            <option>{t('filters.condition.used') || 'Used'}</option>
            <option>{t('filters.condition.fair') || 'Fair'}</option>
          </select>
        </div>

        {/* Sort By Filter */}
        <div className="filter-section">
          <label className="filter-label text-xs font-semibold text-slate-400 mb-2 block">
            {t('filters.sortBy.label') || 'Sort By'}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-900/50 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
          >
            <option>{t('filters.sortBy.newest') || 'Newest'}</option>
            <option>{t('filters.sortBy.priceLow') || 'Price: Low'}</option>
            <option>{t('filters.sortBy.priceHigh') || 'Price: High'}</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="filter-section">
          <label className="filter-label text-xs font-semibold text-slate-400 mb-2 block">
            {t('price.range') || 'Price Range'}
          </label>
          <div className="price-range-box space-y-3">
            <div className="price-values flex justify-between">
              <span className="text-xs font-semibold text-slate-300">{currencySymbol}{priceRange[0]}</span>
              <span className="text-xs font-semibold text-slate-300">{currencySymbol}{priceRange[1]}</span>
            </div>
            <div className="range-track relative h-1 bg-slate-700 rounded-full">
              <div 
                className="range-fill absolute h-full bg-purple-500 rounded-full" 
                style={{
                  width: `${((priceRange[1] - priceRange[0]) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                  marginLeft: `${((priceRange[0] - PRICE_MIN_LIMIT) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`
                }}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Min</label>
                <input
                  type="range"
                  min={PRICE_MIN_LIMIT}
                  max={PRICE_MAX_LIMIT}
                  step={PRICE_STEP}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const newMin = Math.min(parseInt(e.target.value), priceRange[1]);
                    setPriceRange([newMin, priceRange[1]]);
                  }}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Max</label>
                <input
                  type="range"
                  min={PRICE_MIN_LIMIT}
                  max={PRICE_MAX_LIMIT}
                  step={PRICE_STEP}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const newMax = Math.max(parseInt(e.target.value), priceRange[0]);
                    setPriceRange([priceRange[0], newMax]);
                  }}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            onClick={handleResetFilters}
            className="w-full text-xs font-semibold py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300"
          >
            Reset Filters
          </Button>
        )}
      </div>
    );
  }

  // Mobile version - collapsible
  return (
    <div className="search-filters-mobile space-y-3">
      {/* Search Bar - Always Visible */}
      <div className="mobile-search-bar">
        <div className="search-input-wrapper flex items-center gap-2 px-3 py-2 border border-slate-700 rounded-lg bg-slate-900/50">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder={t('filters.search') || "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input flex-1 bg-transparent outline-none text-slate-100 placeholder-slate-500"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="clear-search-btn p-1 hover:bg-slate-700/50 rounded"
            >
              <X size={16} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="mobile-filter-toggle flex gap-2">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
            showFilters
              ? 'bg-purple-600/40 border border-purple-500/50 text-purple-200'
              : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
          {hasActiveFilters && <span className="ml-auto text-lg">●</span>}
        </Button>
        
        {hasActiveFilters && (
          <Button
            onClick={handleClearAllFilters}
            className="p-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg"
          >
            <X size={16} className="text-slate-400" />
          </Button>
        )}
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="mobile-filters-content space-y-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          {/* Condition */}
          <div className="filter-section">
            <label className="filter-label text-xs font-semibold text-slate-400 mb-2 block">CONDITION</label>
            <select
              value={tempCondition === 'all' ? (t('filters.condition.all') || 'All') : tempCondition}
              onChange={(e) => setTempCondition(e.target.value === (t('filters.condition.all') || 'All') ? 'all' : e.target.value)}
              className="filter-select w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-900/50 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
            >
              <option>{t('filters.condition.all') || 'All'}</option>
              <option>{t('filters.condition.likeNew') || 'Like New'}</option>
              <option>{t('filters.condition.used') || 'Used'}</option>
              <option>{t('filters.condition.fair') || 'Fair'}</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="filter-section">
            <label className="filter-label text-xs font-semibold text-slate-400 mb-2 block">SORT BY</label>
            <select
              value={tempSortBy}
              onChange={(e) => setTempSortBy(e.target.value)}
              className="filter-select w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-900/50 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
            >
              <option>{t('filters.sortBy.newest') || 'Newest'}</option>
              <option>{t('filters.sortBy.priceLow') || 'Price: Low'}</option>
              <option>{t('filters.sortBy.priceHigh') || 'Price: High'}</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <label className="filter-label text-xs font-semibold text-slate-400 mb-2 block">PRICE RANGE</label>
            <div className="price-range-box space-y-3">
              <div className="price-values flex justify-between">
                <span className="text-xs font-semibold text-slate-300">{currencySymbol}{tempPriceRange[0]}</span>
                <span className="text-xs font-semibold text-slate-300">{currencySymbol}{tempPriceRange[1]}</span>
              </div>
              <div className="range-track relative h-1 bg-slate-700 rounded-full">
                <div 
                  className="range-fill absolute h-full bg-purple-500 rounded-full" 
                  style={{
                    width: `${((tempPriceRange[1] - tempPriceRange[0]) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                    marginLeft: `${((tempPriceRange[0] - PRICE_MIN_LIMIT) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`
                  }}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Min</label>
                  <input
                    type="range"
                    min={PRICE_MIN_LIMIT}
                    max={PRICE_MAX_LIMIT}
                    step={PRICE_STEP}
                    value={tempPriceRange[0]}
                    onChange={(e) => {
                      const newMin = Math.min(parseInt(e.target.value), tempPriceRange[1]);
                      setTempPriceRange([newMin, tempPriceRange[1]]);
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Max</label>
                  <input
                    type="range"
                    min={PRICE_MIN_LIMIT}
                    max={PRICE_MAX_LIMIT}
                    step={PRICE_STEP}
                    value={tempPriceRange[1]}
                    onChange={(e) => {
                      const newMax = Math.max(parseInt(e.target.value), tempPriceRange[0]);
                      setTempPriceRange([tempPriceRange[0], newMax]);
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="filter-actions flex gap-2">
            <Button
              onClick={handleResetFilters}
              className="flex-1 text-xs font-semibold py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300"
            >
              Reset
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 text-xs font-bold py-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
