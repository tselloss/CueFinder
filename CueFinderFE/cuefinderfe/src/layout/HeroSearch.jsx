import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';

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
  currencySymbol,
  user,
  onAddListing
}) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilters, setShowFilters] = useState(window.innerWidth > 768); // Hidden on mobile, visible on desktop

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // On desktop, always show filters; on mobile, keep current state
      if (!mobile && !showFilters) {
        setShowFilters(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showFilters]);

  const hasActiveFilters = condition !== 'all' || sortBy !== 'newest' || 
    priceRange[0] !== PRICE_MIN_LIMIT || priceRange[1] !== PRICE_MAX_LIMIT;

  const clearAllFilters = () => {
    setCondition('all');
    setSortBy('newest');
    setPriceRange([PRICE_MIN_LIMIT, PRICE_MAX_LIMIT]);
  };

  return (
    <div className="w-full bg-gradient-to-b from-background via-background to-secondary/20 py-8 sm:py-12 px-2 sm:px-4 md:px-6">
      <div className="w-full max-w-5xl mx-auto">
        {/* Hero Title */}
        <div className="text-center mb-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            {t('hero.title')}
          </h1>
          {user && onAddListing && (
            <Button
              onClick={onAddListing}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all h-10 px-4 text-sm sm:text-base font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t('header.addNewListing')}</span><span className="sm:hidden">{t('header.addListing')}</span>
            </Button>
          )}
        </div>
        <p className="text-base md:text-lg text-muted-foreground">
          {t('hero.subtitle')}
        </p>
        </div>

        {/* Search & Filters Card */}
        <Card className="border border-slate-800/70 bg-slate-900/80 shadow-2xl backdrop-blur-sm">
          <CardContent className="p-4 md:p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('search.placeholder', 'Search for cues, brands, models...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10 h-11 text-sm sm:text-base bg-slate-950/80 border border-slate-700/80 text-slate-100 placeholder:text-slate-400 focus:border-blue-500"
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

          {/* Mobile Filter Toggle - Only on mobile */}
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp className="mr-2 h-5 w-5" /> : <ChevronDown className="mr-2 h-5 w-5" />}
              {showFilters ? t('filters.hide', 'Hide Filters') : t('filters.show', 'Show Filters')}
              {hasActiveFilters && (
                <span className="ml-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </Button>
          )}

          {/* Filters Section - Always visible on desktop, toggleable on mobile */}
          {(showFilters || !isMobile) && (
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
              {/* Condition Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  {t('filter.condition', 'Condition')}
                </label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="h-10 bg-slate-950/80 border border-slate-700/80 text-slate-100">
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
                <label className="text-sm font-medium text-slate-200">
                  {t('filter.sortBy', 'Sort By')}
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 bg-slate-950/80 border border-slate-700/80 text-slate-100">
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
                <label className="text-sm font-medium text-slate-200">
                  {t('filter.priceRange', 'Price Range')}
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{currencySymbol}{priceRange[0]}</span>
                    <span>{currencySymbol}{priceRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min={PRICE_MIN_LIMIT}
                    max={PRICE_MAX_LIMIT}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
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
              className="w-full border-slate-700 text-slate-200 hover:text-white"
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
                className="text-slate-300 hover:text-white"
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
    </div>
  );
}

export default HeroSearch;
