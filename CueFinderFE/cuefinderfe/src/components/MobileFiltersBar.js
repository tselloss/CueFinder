import React from 'react';
import { Box, Button, Text, Select, RangeSelector } from 'grommet';
import { Add, FormClose, FormDown, FormUp } from 'grommet-icons';
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
  
  // Check if any filters are active
  const hasActiveFilters = condition !== 'all' || 
    sortBy !== (t('filters.sortBy.newest') || 'Newest First') ||
    priceRange[0] !== PRICE_MIN_LIMIT || priceRange[1] !== PRICE_MAX_LIMIT;
  
  // Apply filters
  const handleApplyFilters = () => {
    setCondition(tempCondition);
    setSortBy(tempSortBy);
    setPriceRange(tempPriceRange);
    setShowMobileFilters(false);
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    const defaultSortBy = t('filters.sortBy.newest') || 'Newest First';
    setTempCondition('all');
    setTempSortBy(defaultSortBy);
    setTempPriceRange([PRICE_MIN_LIMIT, PRICE_MAX_LIMIT]);
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
      setTempPriceRange(priceRange);
    }
  }, [showMobileFilters, condition, sortBy, priceRange]);

  return (
    <>
      <Box
        className="mobile-filters-toolbar"
        pad="16px"
        gap="12px"
        background="linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)"
        border={{ side: 'bottom', color: 'rgba(59, 130, 246, 0.3)', size: '2px' }}
        style={{
          position: 'sticky',
          top: '60px',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Search Bar - Always Visible */}
        <Box direction="row" gap="8px" align="center">
          <Box flex="grow">
            <MaterialInput
              placeholder={t('filters.search') || "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              icon="search"
              style={{ width: '100%' }}
            />
          </Box>
          
          {user && (
            <Button
              icon={<Add size="20px" color="white" />}
              onClick={onAddListing}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                minWidth: '44px',
                height: '44px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            />
          )}
        </Box>

        {/* Filter Toggle & Active Indicator */}
        <Box direction="row" gap="8px" align="center">
          <Button
            icon={showMobileFilters ? <FormUp size="18px" /> : <FormDown size="18px" />}
            label={
              <Box direction="row" gap="6px" align="center">
                <Text size="13px" weight={600}>
                  {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
                </Text>
                {hasActiveFilters && (
                  <Box 
                    background="#3b82f6" 
                    round="full" 
                    pad={{ horizontal: '6px', vertical: '2px' }}
                  >
                    <Text size="11px" weight={700} color="white">●</Text>
                  </Box>
                )}
              </Box>
            }
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            style={{
              flex: 1,
              background: showMobileFilters 
                ? 'rgba(59, 130, 246, 0.2)'
                : 'rgba(30, 41, 59, 0.8)',
              border: showMobileFilters
                ? '2px solid rgba(59, 130, 246, 0.5)'
                : '2px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '10px',
              padding: '10px 14px',
              height: '44px'
            }}
          />
          
          {hasActiveFilters && (
            <Button
              icon={<FormClose size="18px" color="#f87171" />}
              onClick={handleClearAllFilters}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '10px',
                minWidth: '44px',
                height: '44px'
              }}
            />
          )}
        </Box>

        {/* Collapsible Filters */}
        {showMobileFilters && (
          <Box 
            gap="12px" 
            pad="12px"
            background="rgba(15, 23, 42, 0.6)"
            round="10px"
            border={{ color: 'rgba(59, 130, 246, 0.2)', size: '1px' }}
          >
            {/* Condition */}
            <Box>
              <Text size="11px" weight={600} color="#94a3b8" margin={{ bottom: '6px' }}>
                CONDITION
              </Text>
              <Select
                options={[
                  t('filters.condition.all') || 'All',
                  t('filters.condition.likeNew') || 'Like New',
                  t('filters.condition.used') || 'Used',
                  t('filters.condition.fair') || 'Fair'
                ]}
                value={tempCondition === 'all' ? (t('filters.condition.all') || 'All') : tempCondition}
                onChange={({ option }) => setTempCondition(option === (t('filters.condition.all') || 'All') ? 'all' : option)}
                style={{
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  padding: '10px 12px',
                  fontSize: '14px'
                }}
              />
            </Box>

            {/* Sort By */}
            <Box>
              <Text size="11px" weight={600} color="#94a3b8" margin={{ bottom: '6px' }}>
                SORT BY
              </Text>
              <Select
                options={[
                  t('filters.sortBy.newest') || 'Newest',
                  t('filters.sortBy.priceLow') || 'Price: Low',
                  t('filters.sortBy.priceHigh') || 'Price: High'
                ]}
                value={tempSortBy}
                onChange={({ option }) => setTempSortBy(option)}
                style={{
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  padding: '10px 12px',
                  fontSize: '14px'
                }}
              />
            </Box>

            {/* Price Range */}
            <Box>
              <Text size="11px" weight={600} color="#94a3b8" margin={{ bottom: '6px' }}>
                PRICE RANGE
              </Text>
              <Box 
                pad="12px"
                background="rgba(30, 41, 59, 0.5)"
                round="8px"
                gap="10px"
              >
                <Box direction="row" justify="between">
                  <Text size="13px" color="#cbd5e1" weight={600}>
                    {currencySymbol}{tempPriceRange[0]}
                  </Text>
                  <Text size="13px" color="#cbd5e1" weight={600}>
                    {currencySymbol}{tempPriceRange[1]}
                  </Text>
                </Box>
                <Box height="4px" round="full" background="rgba(51,65,85,0.6)">
                  <Box
                    height="4px"
                    round="full"
                    background="#3b82f6"
                    style={{
                      width: `${((tempPriceRange[1] - tempPriceRange[0]) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                      marginLeft: `${((tempPriceRange[0] - PRICE_MIN_LIMIT) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`
                    }}
                  />
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

            {/* Actions */}
            <Box direction="row" gap="8px" margin={{ top: '8px' }}>
              <Button
                label={<Text size="13px" weight={600}>Reset</Text>}
                onClick={handleResetFilters}
                style={{
                  flex: 1,
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '8px',
                  padding: '10px',
                  height: '40px'
                }}
              />
              <Button
                label={<Text size="13px" weight={700} color="white">Apply</Text>}
                onClick={handleApplyFilters}
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  height: '40px',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }}
              />
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}
