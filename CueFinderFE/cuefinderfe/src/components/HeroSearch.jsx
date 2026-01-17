import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function HeroSearch({
  search,
  setSearch,
  condition,
  setCondition,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  PRICE_MIN_LIMIT,
  PRICE_MAX_LIMIT,
  currencySymbol
}) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasActiveFilters = condition !== 'all' || sortBy !== 'newest' || 
    priceRange[0] !== PRICE_MIN_LIMIT || priceRange[1] !== PRICE_MAX_LIMIT;

  const clearAllFilters = () => {
    setCondition('all');
    setSortBy('newest');
    setPriceRange([PRICE_MIN_LIMIT, PRICE_MAX_LIMIT]);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          {t('hero.title')}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          {t('hero.subtitle')}
        </p>
      </div>

      {/* Search & Filters Card */}
      <Card className="border-2 border-primary/20 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 md:p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('search.placeholder', 'Search for cues, brands...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10 h-12 text-base border-2 focus:border-primary"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          {isMobile && (
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="mr-2 h-5 w-5" />
              {t('filters.title', 'Filters')}
              {hasActiveFilters && (
                <span className="ml-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </Button>
          )}

          {/* Filters Section */}
          {(showFilters || !isMobile) && (
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
              {/* Condition Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('filter.condition', 'Condition')}
                </label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filter.all', 'All Conditions')}</SelectItem>
                    <SelectItem value="new">{t('filter.new', 'New')}</SelectItem>
                    <SelectItem value="excellent">{t('filter.excellent', 'Excellent')}</SelectItem>
                    <SelectItem value="good">{t('filter.good', 'Good')}</SelectItem>
                    <SelectItem value="fair">{t('filter.fair', 'Fair')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('filter.sortBy', 'Sort By')}
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('filter.newest', 'Newest First')}</SelectItem>
                    <SelectItem value="price-low">{t('filter.priceLow', 'Price: Low to High')}</SelectItem>
                    <SelectItem value="price-high">{t('filter.priceHigh', 'Price: High to Low')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('filter.priceRange', 'Price Range')}
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{currencySymbol}{priceRange[0]}</span>
                    <span>{currencySymbol}{priceRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min={PRICE_MIN_LIMIT}
                    max={PRICE_MAX_LIMIT}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clear Filters - Mobile */}
          {isMobile && showFilters && hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              {t('filters.clear', 'Clear All Filters')}
            </Button>
          )}

          {/* Clear Filters - Desktop */}
          {!isMobile && hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
              >
                <X className="mr-2 h-4 w-4" />
                {t('filters.clear', 'Clear All')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
