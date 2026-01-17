import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Grid, LayoutGrid, LayoutList } from 'lucide-react';
import { API_BASE_URL, SITE_BASE_URL } from '../config/apiConfig';

// Helper to get full image URL from image object
const getImageUrl = (images) => {
  if (!images || images.length === 0) return '';
  // Find primary image first, otherwise use first image
  const primaryImg = images.find(img => {
    if (typeof img === 'object') return img.isPrimary;
    return false;
  });
  const img = primaryImg || images[0];
  // Handle both string URLs and image objects
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // Uploaded files are served at /uploads/* on the public site (proxied to backend)
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

// Image Placeholder Component
const ImagePlaceholder = ({ height = 'h-48' }) => (
  <div className={`w-full ${height} bg-slate-100 flex items-center justify-center rounded-lg`}>
    <div className="text-center">
      <Grid className="w-8 h-8 mx-auto text-slate-300 mb-2" />
      <p className="text-xs text-slate-400">No Image</p>
    </div>
  </div>
);

export default function CueList({ cues, onSelect, onAdd, query, viewMode, setViewMode, category, condition, cueType, sortBy, priceRange }) {
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
    
    // Category filter (uses itemType injected by App.js: 'cue' or 'case')
    if (category && category !== 'all') {
      if (category === 'cues' && c.itemType !== 'cue') return false;
      if (category === 'cases' && c.itemType !== 'case') return false;
    }
    
    // Condition filter
    if (condition && condition !== 'all' && condition !== 'All Conditions') {
      if (c.condition !== condition) return false;
    }
    
    // Cue Type filter
    // If a CueType is selected, only cues should remain visible.
    // Normalize to support different backend field casing/serialization.
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
    <div className="w-full p-4 md:p-6 relative z-10">
      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6 justify-end">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
          className="gap-2"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Grid</span>
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="gap-2"
        >
          <LayoutList className="w-4 h-4" />
          <span className="hidden sm:inline">List</span>
        </Button>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((c) => {
            const displayPrice = Number(c.price || 0);
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-lg transition-all border-border/50 overflow-hidden group"
                onClick={() => onSelect(c)}
              >
                {/* Image Container */}
                <div className="relative overflow-hidden h-48 bg-slate-100">
                  {getImageUrl(c.images) ? (
                    <img
                      src={getImageUrl(c.images)}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {c.itemType === 'case' && (
                      <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-md">
                        CASE
                      </span>
                    )}
                    {(c.isSold || c.is_sold) ? (
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-md">
                        SOLD
                      </span>
                    ) : c.condition ? (
                      <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-md">
                        {c.condition}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Content */}
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-base md:text-lg truncate">
                      {c.title || c.brand}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {c.brand}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>📍</span>
                    <span className="truncate">{c.location || 'Unknown'}</span>
                  </div>

                  <div className="bg-blue-500 text-white rounded-md p-3 mt-4">
                    <p className="font-bold text-xl">
                      {currencySymbol}{displayPrice.toFixed(0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {filtered.map((c) => {
            const displayPrice = Number(c.price || 0);
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-lg transition-all border-border/50 overflow-hidden"
                onClick={() => onSelect(c)}
              >
                <div className="flex gap-4 p-4 md:p-6">
                  {/* Image */}
                  <div className="flex-shrink-0 w-32 h-24 bg-slate-100 rounded-lg overflow-hidden">
                    {getImageUrl(c.images) ? (
                      <img
                        src={getImageUrl(c.images)}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Grid className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-base md:text-lg">
                          {c.title || c.brand}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {c.brand}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="font-bold text-lg md:text-xl text-blue-500">
                          {currencySymbol}{displayPrice.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <span>📍</span>
                        <span>{c.location || 'Unknown'}</span>
                      </div>
                      {c.condition && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                          {c.condition}
                        </span>
                      )}
                      {c.itemType === 'case' && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                          CASE
                        </span>
                      )}
                      {(c.isSold || c.is_sold) && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                          SOLD
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Results Info */}
      <div className="flex justify-between items-center p-4 mt-6 border-t border-border bg-card rounded-lg">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{filtered.length}</span>{' '}
          {category === 'cases' ? 'cases' : category === 'cues' ? 'cues' : 'items'} available
        </p>
      </div>
    </div>
  );
}
