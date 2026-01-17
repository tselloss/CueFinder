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
import { Box, Button, Text, Select, RangeSelector } from 'grommet';
import { FormDown, FormUp, FormClose, Search as SearchIcon } from 'grommet-icons';
import { useTranslation } from 'react-i18next';
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
      <Box className="search-filters-desktop" gap="medium">
        {/* Search */}
        <Box className="filter-section">
          <Box className="search-input-wrapper">
            <SearchIcon size="18px" color="#94a3b8" />
            <input
              type="text"
              placeholder={t('filters.search') || "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="clear-search-btn"
              >
                <FormClose size="16px" />
              </button>
            )}
          </Box>
        </Box>

        {/* Condition Filter */}
        <Box className="filter-section">
          <Text className="filter-label">
            {t('filters.condition.label') || 'Condition'}
          </Text>
          <Select
            options={[
              t('filters.condition.all') || 'All',
              t('filters.condition.likeNew') || 'Like New',
              t('filters.condition.used') || 'Used',
              t('filters.condition.fair') || 'Fair'
            ]}
            value={condition === 'all' ? (t('filters.condition.all') || 'All') : condition}
            onChange={({ option }) => setCondition(option === (t('filters.condition.all') || 'All') ? 'all' : option)}
            className="filter-select"
          />
        </Box>

        {/* Sort By Filter */}
        <Box className="filter-section">
          <Text className="filter-label">
            {t('filters.sortBy.label') || 'Sort By'}
          </Text>
          <Select
            options={[
              t('filters.sortBy.newest') || 'Newest',
              t('filters.sortBy.priceLow') || 'Price: Low',
              t('filters.sortBy.priceHigh') || 'Price: High'
            ]}
            value={sortBy}
            onChange={({ option }) => setSortBy(option)}
            className="filter-select"
          />
        </Box>

        {/* Price Range Filter */}
        <Box className="filter-section">
          <Text className="filter-label">
            {t('price.range') || 'Price Range'}
          </Text>
          <Box className="price-range-box">
            <Box direction="row" justify="between" className="price-values">
              <Text size="13px" weight={600}>{currencySymbol}{priceRange[0]}</Text>
              <Text size="13px" weight={600}>{currencySymbol}{priceRange[1]}</Text>
            </Box>
            <Box className="range-track">
              <Box className="range-fill" style={{
                width: `${((priceRange[1] - priceRange[0]) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                marginLeft: `${((priceRange[0] - PRICE_MIN_LIMIT) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`
              }} />
            </Box>
            <RangeSelector
              direction="horizontal"
              min={PRICE_MIN_LIMIT}
              max={PRICE_MAX_LIMIT}
              step={PRICE_STEP}
              values={priceRange}
              onChange={setPriceRange}
            />
          </Box>
        </Box>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            label={<Text size="13px" weight={600}>Reset Filters</Text>}
            onClick={handleResetFilters}
            className="reset-btn"
          />
        )}
      </Box>
    );
  }

  // Mobile version - collapsible
  return (
    <Box className="search-filters-mobile">
      {/* Search Bar - Always Visible */}
      <Box className="mobile-search-bar">
        <Box className="search-input-wrapper">
          <SearchIcon size="18px" color="#94a3b8" />
          <input
            type="text"
            placeholder={t('filters.search') || "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="clear-search-btn"
            >
              <FormClose size="16px" />
            </button>
          )}
        </Box>
      </Box>

      {/* Filter Toggle */}
      <Box className="mobile-filter-toggle" direction="row" gap="8px">
        <Button
          icon={showFilters ? <FormUp size="18px" /> : <FormDown size="18px" />}
          label={
            <Box direction="row" gap="6px" align="center">
              <Text size="13px" weight={600}>
                {showFilters ? 'Hide Filters' : 'Filters'}
              </Text>
              {hasActiveFilters && (
                <Box className="active-indicator">●</Box>
              )}
            </Box>
          }
          onClick={() => setShowFilters(!showFilters)}
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
        />
        
        {hasActiveFilters && (
          <Button
            icon={<FormClose size="18px" />}
            onClick={handleClearAllFilters}
            className="clear-filters-btn"
          />
        )}
      </Box>

      {/* Collapsible Filters */}
      {showFilters && (
        <Box className="mobile-filters-content">
          {/* Condition */}
          <Box className="filter-section">
            <Text className="filter-label">CONDITION</Text>
            <Select
              options={[
                t('filters.condition.all') || 'All',
                t('filters.condition.likeNew') || 'Like New',
                t('filters.condition.used') || 'Used',
                t('filters.condition.fair') || 'Fair'
              ]}
              value={tempCondition === 'all' ? (t('filters.condition.all') || 'All') : tempCondition}
              onChange={({ option }) => setTempCondition(option === (t('filters.condition.all') || 'All') ? 'all' : option)}
              className="filter-select"
            />
          </Box>

          {/* Sort By */}
          <Box className="filter-section">
            <Text className="filter-label">SORT BY</Text>
            <Select
              options={[
                t('filters.sortBy.newest') || 'Newest',
                t('filters.sortBy.priceLow') || 'Price: Low',
                t('filters.sortBy.priceHigh') || 'Price: High'
              ]}
              value={tempSortBy}
              onChange={({ option }) => setTempSortBy(option)}
              className="filter-select"
            />
          </Box>

          {/* Price Range */}
          <Box className="filter-section">
            <Text className="filter-label">PRICE RANGE</Text>
            <Box className="price-range-box">
              <Box direction="row" justify="between" className="price-values">
                <Text size="13px" weight={600}>{currencySymbol}{tempPriceRange[0]}</Text>
                <Text size="13px" weight={600}>{currencySymbol}{tempPriceRange[1]}</Text>
              </Box>
              <Box className="range-track">
                <Box className="range-fill" style={{
                  width: `${((tempPriceRange[1] - tempPriceRange[0]) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                  marginLeft: `${((tempPriceRange[0] - PRICE_MIN_LIMIT) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`
                }} />
              </Box>
              <RangeSelector
                direction="horizontal"
                min={PRICE_MIN_LIMIT}
                max={PRICE_MAX_LIMIT}
                step={PRICE_STEP}
                values={tempPriceRange}
                onChange={setTempPriceRange}
              />
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box direction="row" gap="8px" className="filter-actions">
            <Button
              label={<Text size="13px" weight={600}>Reset</Text>}
              onClick={handleResetFilters}
              className="reset-btn"
            />
            <Button
              label={<Text size="13px" weight={700}>Apply</Text>}
              onClick={handleApplyFilters}
              className="apply-btn"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
