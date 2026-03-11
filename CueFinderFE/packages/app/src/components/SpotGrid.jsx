import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Visual grid of raffle spots.
 *
 * Spot colours:
 *   teal   = available
 *   gray   = pending (claimed, not paid)
 *   green  = paid
 *   blue   = yours (pending or paid)
 */
export default function SpotGrid({ raffle, currentUserId, onSelectSpot, selectedSpot }) {
  const { t } = useTranslation();
  const { totalSpots, entries = [] } = raffle;

  const entryBySpot = {};
  entries.forEach(e => { entryBySpot[e.spotNumber] = e; });

  const cols = totalSpots <= 25 ? 5 : totalSpots <= 100 ? 10 : 20;

  // How many username chars fit before we clip (based on column density)
  const maxNameLen = cols <= 5 ? 9 : cols <= 10 ? 6 : 0; // 0 = no name shown, tooltip only

  function spotState(n) {
    const e = entryBySpot[n];
    if (!e) return 'available';
    if (e.userId === currentUserId) return 'mine';
    if (e.status === 'paid') return 'paid';
    return 'pending';
  }

  const stateStyle = {
    available: 'bg-teal-500/20 border-teal-500 text-teal-400 hover:bg-teal-500/40 cursor-pointer',
    mine:      'bg-blue-500/30 border-blue-400 text-blue-300 font-bold',
    paid:      'bg-green-500/20 border-green-500 text-green-400',
    pending:   'bg-gray-700/60 border-gray-600 text-gray-500',
  };

  const stateLabel = {
    available: t('raffle.spotGrid.tooltipAvailable'),
    mine:      t('raffle.spotGrid.tooltipMine'),
    paid:      t('raffle.spotGrid.tooltipPaid'),
    pending:   t('raffle.spotGrid.tooltipPending'),
  };

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        {[
          { state: 'available', label: t('raffle.spotGrid.available') },
          { state: 'pending',   label: t('raffle.spotGrid.pending') },
          { state: 'paid',      label: t('raffle.spotGrid.paid') },
          { state: 'mine',      label: t('raffle.spotGrid.mine') },
        ].map(({ state, label }) => (
          <span key={state} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded border ${stateStyle[state].split(' ')[0]} ${stateStyle[state].split(' ')[1]}`} />
            {label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalSpots }, (_, i) => i + 1).map(n => {
          const state = spotState(n);
          const entry = entryBySpot[n];
          const isSelected = selectedSpot === n;
          const hasUser = entry && state !== 'available';

          // Build tooltip
          let tooltip = `Spot #${n} — ${stateLabel[state]}`;
          if (entry?.name || entry?.username) tooltip += ` · ${entry.name || entry.username}`;

          // Name to display inside cell
          let displayName = null;
          const entryLabel = entry?.name || entry?.username || '';
          if (hasUser && entryLabel && maxNameLen > 0) {
            displayName = entryLabel.length > maxNameLen
              ? entryLabel.slice(0, maxNameLen) + '…'
              : entryLabel;
          }

          return (
            <button
              key={n}
              title={tooltip}
              disabled={state !== 'available'}
              onClick={() => state === 'available' && onSelectSpot && onSelectSpot(n)}
              className={`
                rounded border text-xs transition-all flex flex-col items-center justify-center
                ${hasUser ? 'py-1.5 gap-0' : 'py-1'}
                ${stateStyle[state]}
                ${isSelected ? 'ring-2 ring-white scale-110' : ''}
                ${state !== 'available' ? 'cursor-default' : ''}
              `}
            >
              <span className="leading-none font-semibold">{n}</span>
              {displayName && (
                <span className="leading-none mt-0.5 text-[9px] opacity-75 font-normal truncate w-full text-center px-0.5">
                  {displayName}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
