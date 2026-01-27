import React from 'react';
import { Button } from '../../../components/ui/button.jsx';
import { LayoutGrid, LayoutList } from 'lucide-react';

/**
 * CueViewToggle - Toggle between grid and list view
 * @component
 * @param {string} viewMode - Current view mode ('grid' or 'list')
 * @param {Function} setViewMode - Callback to change view mode
 */
export default function CueViewToggle({ viewMode, setViewMode }) {
  return (
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
  );
}
