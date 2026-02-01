import React from 'react';
import { Flag, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';

export default function ListingRow({ item, onFlag, onDelete }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-2 sm:px-4 py-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="inline-block px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-200 text-gray-700 text-[10px] sm:text-xs font-bold rounded">
            {item.itemType.toUpperCase()}
          </span>
          <span className="font-bold text-gray-900 text-xs sm:text-sm">{item.title}</span>
        </div>
      </td>
      <td className="px-2 sm:px-4 py-3 text-gray-600 text-xs sm:text-sm">
        €{Number(item.price || 0).toFixed(2)}
      </td>
      <td className="px-2 sm:px-4 py-3">
        {item.flagged ? (
          <span className="inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-orange-500 text-white text-[10px] sm:text-xs font-medium rounded">
            FLAGGED
          </span>
        ) : (
          <span className="text-gray-400 text-[10px] sm:text-xs">—</span>
        )}
      </td>
      <td className="px-2 sm:px-4 py-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFlag(item)}
            title="Flag"
            className="min-w-[44px] min-h-[44px] sm:w-8 sm:h-8 p-0 touch-manipulation"
          >
            <Flag className="w-4 h-4 sm:w-4 sm:h-4 text-orange-600" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(item)}
            title="Delete"
            className="min-w-[44px] min-h-[44px] sm:w-8 sm:h-8 p-0 touch-manipulation"
          >
            <Trash2 className="w-4 h-4 sm:w-4 sm:h-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
