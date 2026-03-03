import React from 'react';
import { Flag, Trash2 } from 'lucide-react';

export default function ListingRow({ item, onFlag, onDelete, isAltRow }) {
  return (
    <tr className={`transition-colors ${isAltRow ? 'bg-slate-800' : 'bg-slate-750'} hover:bg-slate-700`}>
      <td className="px-3 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white ${
            item.itemType === 'cue' ? 'bg-blue-700' : 'bg-indigo-700'
          }`}>
            {item.itemType === 'cue' ? '🎱 Cue' : item.itemType === 'case' ? '📦 Case' : item.itemType === 'table' ? '🎰 Table' : '⚙️ Accessory'}
          </span>
          <span className="font-semibold text-slate-100 text-xs sm:text-sm truncate leading-snug">{item.title}</span>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-4">
        <span className="font-bold text-slate-100 text-xs sm:text-sm">€{Number(item.price || 0).toFixed(2)}</span>
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-4">
        {item.flagged ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-orange-900 text-orange-300 text-[11px] sm:text-xs font-bold rounded-full border border-orange-700">
            ⚠️ FLAGGED
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-green-900 text-green-300 text-[11px] sm:text-xs font-bold rounded-full border border-green-700">
            ✓ ACTIVE
          </span>
        )}
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to flag "${item.title}"?`)) {
                onFlag(item);
              }
            }}
            title="Flag this listing"
            className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[11px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-colors"
          >
            <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Flag</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
                onDelete(item);
              }
            }}
            title="Delete this listing"
            className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
