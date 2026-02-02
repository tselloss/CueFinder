import { useState, useMemo } from 'react';

/**
 * useSorting Hook
 * Manages sorting state and returns sorted items
 * 
 * @param {Array} items - Items to sort
 * @param {string} defaultSort - Default sort key (default: 'newest')
 * @param {Function} sortFn - Custom sort function(a, b, sortKey) -> number
 * @returns {Object} { sortBy, setSortBy, sorted }
 */
export function useSorting(items, defaultSort = 'newest', sortFn = null) {
  const [sortBy, setSortBy] = useState(defaultSort);
  
  const sorted = useMemo(() => {
    if (!items || items.length === 0) return [];
    const arr = [...items];
    
    // Use custom sort function if provided
    if (sortFn) {
      return arr.sort((a, b) => sortFn(a, b, sortBy));
    }
    
    // Default sort implementations
    if (sortBy === 'price_asc') {
      return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
      return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'name_asc') {
      return arr.sort((a, b) => {
        const nameA = (a.title || a.name || '').toLowerCase();
        const nameB = (b.title || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === 'name_desc') {
      return arr.sort((a, b) => {
        const nameA = (a.title || a.name || '').toLowerCase();
        const nameB = (b.title || b.name || '').toLowerCase();
        return nameB.localeCompare(nameA);
      });
    }
    
    // Default: newest first (by id)
    return arr.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [items, sortBy, sortFn]);
  
  return { sortBy, setSortBy, sorted };
}
