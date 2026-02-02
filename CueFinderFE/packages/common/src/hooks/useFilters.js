import { useState, useMemo } from 'react';

/**
 * useFilters Hook
 * Manages filter state and returns filtered items
 * Supports multiple filter criteria
 * 
 * @param {Array} items - Items to filter
 * @param {Object} defaultFilters - Initial filter values
 * @param {Function} filterFn - Custom filter function(item, filters) -> boolean
 * @returns {Object} { filters, setFilters, setFilter, clearFilters, filtered }
 */
export function useFilters(items, defaultFilters = {}, filterFn = null) {
  const [filters, setFilters] = useState(defaultFilters);
  
  const filtered = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    return items.filter(item => {
      // Use custom filter function if provided
      if (filterFn) {
        return filterFn(item, filters);
      }
      
      // Default filter: match all filter criteria
      return Object.entries(filters).every(([key, value]) => {
        if (!value && value !== 0) return true; // Skip empty filters
        
        const itemValue = item[key];
        if (typeof itemValue === 'string' && typeof value === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }
        return itemValue === value;
      });
    });
  }, [items, filters, filterFn]);
  
  return {
    filters,
    setFilters,
    setFilter: (key, value) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    clearFilters: () => setFilters(defaultFilters),
    clearFilter: (key) => {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      });
    },
    filtered
  };
}
