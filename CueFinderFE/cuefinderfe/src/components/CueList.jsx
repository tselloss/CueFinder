import React from 'react';
import { Grid, List as ListIcon, ImageIcon } from 'lucide-react';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { HeroSearch } from './HeroSearch';
import AppFooter from './AppFooter.jsx';

// Helper to get full image URL from image object
const getImageUrl = (images) => {
  if (!images || images.length === 0) return '';
  const primaryImg = images.find(img => {
    if (typeof img === 'object') return img.isPrimary;
    return false;
  });
  const img = primaryImg || images[0];
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  return `${API_BASE_URL}${url}`;
};

// Image placeholder component
const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
    <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
    <p className="text-xs text-muted-foreground mt-2">No Image</p>
  </div>
);

// Condition badge component
const ConditionBadge = ({ condition, isSold }) => {
  if (isSold) {
    return (
      <div className="absolute top-2 right-2 z-10 bg-destructive/90 text-white px-2 py-1 rounded-md text-xs font-bold">
        SOLD
      </div>
    );
  }
  if (condition) {
    const colors = {
      'New': 'bg-green-500/90 text-white',
      'Excellent': 'bg-blue-500/90 text-white',
      'Good': 'bg-yellow-500/90 text-white',
      'Fair': 'bg-orange-500/90 text-white',
      'Poor': 'bg-red-500/90 text-white'
    };
    return (
      <div className={`absolute top-2 right-2 z-10 ${colors[condition] || 'bg-primary/90 text-white'} px-2 py-1 rounded-md text-xs font-bold`}>
        {condition}
      </div>
    );
  }
  return null;
};

export default function CueList({ 
  cues, 
  onSelect, 
  onAdd, 
  query, 
  viewMode, 
  setViewMode, 
  category, 
  condition, 
  cueType, 
  sortBy, 
  priceRange,
  search,
  setSearch,
  setCondition,
  setSortBy,
  setPriceRange,
  PRICE_MIN_LIMIT,
  PRICE_MAX_LIMIT,
  user
}) {
  const currencySymbol = '€';

  console.log(`[CueList] Rendering with cueType prop = "${cueType}", category = "${category}"`);

  // Filter by search, category, condition, and cue type
  let filtered = (cues || []).filter((c) => {
    // Text search
    if (query) {
      const q = query.toLowerCase();
      const matchesSearch = (c.title || '').toLowerCase().includes(q) || 
                           (c.brand || '').toLowerCase().includes(q) || 
                           (c.location || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (category && category !== 'all') {
      if (category === 'cues' && c.itemType !== 'cue') return false;
      if (category === 'cases' && c.itemType !== 'case') return false;
    }

    // Condition filter
    if (condition && condition !== 'all' && condition !== 'All Conditions') {
      if (c.condition !== condition) return false;
    }

    // Cue Type filter
    if (cueType && cueType !== 'all') {
      if (c.itemType !== 'cue') return false;
      const itemCueType = (c.cueType ?? c.cue_type ?? '').toString().toLowerCase();
      const filterCueType = cueType.toLowerCase();
      console.log(`[CueType Filter] Cue: "${c.title}", cueType field: "${c.cueType}", cue_type field: "${c.cue_type}", computed: "${itemCueType}", filter: "${filterCueType}", match: ${itemCueType === filterCueType}`);
      if (itemCueType !== filterCueType) return false;
    }

    // Price range filter
    const price = Number(c.price || 0);
    if (Array.isArray(priceRange) && priceRange.length === 2) {
      const [min, max] = priceRange;
      if (price < min) return false;
      if (price > max) return false;
    }

    return true;
  });

  // Sort
  if (sortBy === 'price_asc') {
    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortBy === 'price_desc') {
    filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else {
    // newest first (default)
    filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  return (
    <div className="w-full relative z-10">
      {/* Hero Section - Now part of scrolling content */}
      <div className="bg-gradient-to-b from-background via-background to-secondary/20 py-4 sm:py-6 px-2 sm:px-4 md:px-6">
        <HeroSearch
          search={search}
          setSearch={setSearch}
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
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 pb-8">
          {filtered.map((c) => {
            const displayPrice = Number(c.price || 0);
            const imageUrl = getImageUrl(c.images);
            const isSold = c.isSold || c.is_sold;

            return (
              <Card 
                key={c.id} 
                onClick={() => onSelect(c)}
                className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 group"
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-muted overflow-hidden group-hover:bg-muted/80 transition-colors">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={c.title || c.brand}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}
                  <ConditionBadge condition={c.condition} isSold={isSold} />
                </div>

                {/* Content */}
                <CardContent className="p-3 sm:p-3 md:p-4 space-y-2 flex-1 flex flex-col">
                  <div>
                    <h3 className="font-semibold text-xs sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                      {c.title || c.brand}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {c.brand}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <span>📍</span>
                    <span className="truncate">{c.location || 'Unknown'}</span>
                  </div>

                  {/* Price Badge */}
                  <div className="inline-block bg-primary text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-bold">
                    <span className="text-xs sm:text-sm">{currencySymbol}</span>
                    <span className="text-sm sm:text-lg">{displayPrice.toFixed(0)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2 sm:space-y-3 pb-8">
          {filtered.map((c) => {
            const displayPrice = Number(c.price || 0);
            const imageUrl = getImageUrl(c.images);
            const isSold = c.isSold || c.is_sold;

            return (
              <Card 
                key={c.id} 
                onClick={() => onSelect(c)}
                className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50"
              >
                <div className="flex gap-2 sm:gap-4 p-2 sm:p-3 md:p-4">
                  {/* Image Container */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden group hover:bg-muted/80 transition-colors">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={c.title || c.brand}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <ImagePlaceholder />
                    )}
                    <ConditionBadge condition={c.condition} isSold={isSold} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-1 sm:gap-2 justify-between min-w-0">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground hover:text-primary transition-colors">
                        {c.title || c.brand}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {c.brand}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <span>📍</span>
                        <span>{c.location || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-end flex-shrink-0">
                    <div className="bg-primary text-white px-3 py-2 rounded-md">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-medium">{currencySymbol}</span>
                        <span className="text-xl font-bold">{displayPrice.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer with counter and view toggle */}
      <div className="flex flex-col gap-3 p-2 sm:p-4 border-t border-border bg-card/50 rounded-lg mt-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>
          {' '}
          {category === 'cases' ? 'cases' : category === 'cues' ? 'cues' : 'items'} available
        </div>
        <div className="flex gap-1 sm:gap-2 justify-center">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="gap-1 text-xs sm:text-sm px-2 sm:px-4"
          >
            <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-1 text-xs sm:text-sm px-2 sm:px-4"
          >
            <ListIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
        </div>
      </div>

      {/* App Footer - appears after all listings */}
      <AppFooter />
      </div>
    </div>
  );
}
