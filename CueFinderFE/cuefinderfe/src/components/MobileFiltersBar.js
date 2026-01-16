import React from 'react';
import { Box, Button, Text, TextInput, Select, RangeSelector } from 'grommet';
import { Add, Search } from 'grommet-icons';
import { useTranslation } from 'react-i18next';

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

  return (
    <Box
      className="mobile-filters-toolbar"
      background="background-front"
      pad={{ horizontal: 'small', vertical: 'small' }}
      gap="small"
    >
      {/* Header with Toggle */}
      <Box direction="row" align="center" justify="between">
        <Text size="small" weight={700} color="#cbd5e1">Filters & Sorting</Text>
        <Button
          plain
          onClick={() => setShowMobileFilters((prev) => !prev)}
          label={
            <Box direction="row" gap="xsmall" align="center">
              <Text size="small" color="#60a5fa" weight={600}>
                {showMobileFilters ? 'Hide' : 'Show'}
              </Text>
              <Text 
                size="small"
                style={{ 
                  transform: showMobileFilters ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease',
                  color: '#60a5fa'
                }}
              >
                ▼
              </Text>
            </Box>
          }
        />
      </Box>

      {/* Search Bar - Always Visible */}
      <Box 
        direction="row" 
        align="center"
        background="rgba(30, 41, 59, 0.8)"
        pad={{ horizontal: 'small', vertical: 'xsmall' }}
        round="small"
        border={{ color: 'rgba(59, 130, 246, 0.3)', size: '1px' }}
      >
        <Search size="16px" color="#3b82f6" style={{ marginRight: '8px' }} />
        <TextInput
          placeholder="Search cues, brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          plain
          style={{
            fontSize: '14px',
            border: 'none',
            background: 'transparent',
            padding: '6px 0',
            color: '#f1f5f9'
          }}
        />
        {search && (
          <Button
            plain
            icon={<Text size="large" style={{ color: '#94a3b8' }}>×</Text>}
            onClick={() => setSearch('')}
            style={{ padding: '2px', minWidth: 'auto' }}
          />
        )}
      </Box>

      {/* Collapsible Filters */}
      {showMobileFilters && (
        <Box gap="small">
          {/* Quick Filter Bar */}
          <Box gap="xxsmall">
            <Text size="xsmall" weight={700} color="#a5b4fc" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Filter bar
            </Text>
            {/* Dropdown Row */}
            <Box direction="row" gap="xsmall" fill>
              <Box direction="row" gap="xsmall" align="center" flex>
                <Text size="xsmall" color="#cbd5e1" weight={600} style={{ whiteSpace: 'nowrap' }}>Filter:</Text>
                <Select
                  options={[
                    t('filters.condition.all'),
                    t('filters.condition.likeNew'),
                    t('filters.condition.used'),
                    t('filters.condition.fair')
                  ]}
                  value={condition === 'all' ? t('filters.condition.all') : condition}
                  onChange={({ option }) => setCondition(option === t('filters.condition.all') ? 'all' : option)}
                  size="small"
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                    borderRadius: '12px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    flex: 1,
                    minWidth: 0
                  }}
                />
              </Box>

              <Box direction="row" gap="xsmall" align="center" flex>
                <Text size="xsmall" color="#cbd5e1" weight={600} style={{ whiteSpace: 'nowrap' }}>Sort:</Text>
                <Select
                  options={[
                    t('filters.sort.newest'),
                    t('filters.sort.low'),
                    t('filters.sort.high')
                  ]}
                  value={
                    sortBy === 'newest' ? t('filters.sort.newest') :
                    sortBy === 'price_asc' ? t('filters.sort.low') :
                    t('filters.sort.high')
                  }
                  onChange={({ option }) => {
                    if (option === t('filters.sort.newest')) setSortBy('newest');
                    else if (option === t('filters.sort.low')) setSortBy('price_asc');
                    else setSortBy('price_desc');
                  }}
                  size="small"
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                    borderRadius: '12px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    flex: 1,
                    minWidth: 0
                  }}
                />
              </Box>
            </Box>

            {/* New Listing Button - Full Width */}
            {user && (
              <Button
                icon={<Add size="16px" />}
                label={<Text size="small" weight={700} color="white">New Listing</Text>}
                onClick={onAddListing}
                fill="horizontal"
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                  fontSize: '14px',
                  fontWeight: 700
                }}
              />
            )}
          </Box>

          {/* Browse By Category */}
          <Box gap="xxsmall">
            <Text size="xsmall" weight={700} color="#a5b4fc" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Browse by
            </Text>
            <Box direction="row" gap="xsmall" overflow={{ horizontal: 'auto' }} style={{ flexWrap: 'nowrap' }}>
              {/* Category Filter */}
              <Select
                options={[
                  { label: '📦 All Items', value: 'all' },
                  { label: '🎯 Cues', value: 'cues' },
                  { label: '💼 Cases', value: 'cases' }
                ]}
                labelKey="label"
                valueKey="value"
                value={
                  category === 'cues' ? { label: '🎯 Cues', value: 'cues' } :
                  category === 'cases' ? { label: '💼 Cases', value: 'cases' } :
                  { label: '📦 All Items', value: 'all' }
                }
                onChange={({ option }) => setCategory(option.value)}
                size="small"
                style={{
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(99, 102, 241, 0.5)',
                  borderRadius: '22px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  minWidth: '120px',
                  whiteSpace: 'nowrap'
                }}
              />

              {/* Cue Type Filter - Only show when Cues selected */}
              {category === 'cues' && (
                <Select
                  options={[
                    { label: 'All Types', value: 'all' },
                    { label: '🎯 Playing', value: 'playing' },
                    { label: '💥 Break', value: 'break' },
                    { label: '🚀 Jump', value: 'jump' }
                  ]}
                  labelKey="label"
                  valueKey="value"
                  value={
                    cueType === 'playing' ? { label: '🎯 Playing', value: 'playing' } :
                    cueType === 'break' ? { label: '💥 Break', value: 'break' } :
                    cueType === 'jump' ? { label: '🚀 Jump', value: 'jump' } :
                    { label: 'All Types', value: 'all' }
                  }
                  onChange={({ option }) => setCueType(option.value)}
                  size="small"
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                    borderRadius: '22px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    minWidth: '120px',
                    whiteSpace: 'nowrap'
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Price Range */}
          <Box
            background="rgba(30, 41, 59, 0.75)"
            pad="small"
            round="small"
            border={{ color: 'rgba(99, 102, 241, 0.35)', size: '1px' }}
            gap="xsmall"
          >
            <Box direction="row" justify="between" align="center">
              <Text size="xsmall" weight={700} color="#e0e7ff">Price range</Text>
              <Text size="xsmall" color="#a5b4fc" weight={600}>
                {currencySymbol}{priceRange[0]} – {currencySymbol}{priceRange[1]}
              </Text>
            </Box>
            <Box gap="xsmall">
              <Box height="4px" round="large" background="rgba(51,65,85,0.6)">
                <Box
                  height="4px"
                  round="large"
                  background="linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)"
                  style={{
                    width: `${((priceRange[1] - priceRange[0]) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                    marginLeft: `${((priceRange[0] - PRICE_MIN_LIMIT) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100}%`,
                    transition: 'width 0.1s ease, margin-left 0.1s ease'
                  }}
                />
              </Box>
              <RangeSelector
                direction="horizontal"
                min={PRICE_MIN_LIMIT}
                max={PRICE_MAX_LIMIT}
                step={PRICE_STEP}
                values={priceRange}
                onChange={setPriceRange}
                size="small"
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
