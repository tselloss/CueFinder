import React from 'react';
import { Card } from '../../../components/ui/card.jsx';
import { Grid } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

/**
 * CueListItem - Individual cue item for list view
 * @component
 * @param {Object} cue - The cue data object
 * @param {Function} onSelect - Callback when item is clicked
 * @param {string} currencySymbol - Currency symbol to display
 */
export default function CueListItem({ cue, onSelect, currencySymbol = '€' }) {
  const displayPrice = Number(cue.price || 0);

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all border-border/50 overflow-hidden"
      onClick={() => onSelect(cue)}
    >
      <div className="flex gap-4 p-4 md:p-6">
        {/* Image */}
        <div className="flex-shrink-0 w-32 h-24 bg-slate-100 rounded-lg overflow-hidden">
          {getImageUrl(cue.images) ? (
            <img
              src={getImageUrl(cue.images)}
              alt={cue.title}
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
                {cue.title || cue.brand}
              </h3>
              <p className="text-sm text-muted-foreground">
                {cue.brand}
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
              <span>{cue.location || 'Unknown'}</span>
            </div>
            {cue.condition && (
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                {cue.condition}
              </span>
            )}
            {cue.itemType === 'case' && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                CASE
              </span>
            )}
            {(cue.isSold || cue.is_sold) && (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                SOLD
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
