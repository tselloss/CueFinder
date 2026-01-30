import React from 'react';
import { Card, CardContent } from '../../../components/ui/card.jsx';
import { Grid } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

/**
 * CueCard - Individual cue card for grid view
 * @component
 * @param {Object} cue - The cue data object
 * @param {Function} onSelect - Callback when card is clicked
 * @param {string} currencySymbol - Currency symbol to display
 */
export default function CueCard({ cue, onSelect, currencySymbol = '€' }) {
  const displayPrice = Number(cue.price || 0);

  return (
    <Card
      data-testid="cue-card"
      className="cursor-pointer hover:shadow-lg transition-all border-border/50 overflow-hidden group"
      onClick={() => onSelect(cue)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden h-48 bg-slate-100">
        {getImageUrl(cue.images) ? (
          <img
            src={getImageUrl(cue.images)}
            alt={cue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Grid className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">No Image</p>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {cue.itemType === 'case' && (
            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-md">
              CASE
            </span>
          )}
          {cue.isSold || cue.is_sold ? (
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-md">
              SOLD
            </span>
          ) : cue.condition ? (
            <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-md">
              {cue.condition}
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <CardContent className="pt-4 pb-4 space-y-3">
        <div>
          <h3 className="font-bold text-base md:text-lg truncate">
            {cue.title || cue.brand}
          </h3>
          <p className="text-sm text-muted-foreground">
            {cue.brand}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>📍</span>
          <span className="truncate">{cue.location || 'Unknown'}</span>
        </div>

        <div className="bg-blue-500 text-white rounded-md p-3 mt-4">
          <p className="font-bold text-xl">
            {currencySymbol}{displayPrice.toFixed(0)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
