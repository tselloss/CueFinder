import { useFilters, useSorting, usePagination } from '@cuefinder/common';

/**
 * useCueFiltering Hook
 * Handles filtering, sorting, and pagination of cues
 */
export function useCueFiltering(cues) {
  const { filters, setFilter, clearFilters, filtered: filteredItems } = useFilters(
    cues,
    {
      search: '',
      category: 'all',
      condition: 'all',
      cueType: 'all',
      priceMin: 0,
      priceMax: Infinity
    },
    (item, filters) => {
      // Text search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesSearch = 
          (item.title || '').toLowerCase().includes(q) ||
          (item.brand || '').toLowerCase().includes(q) ||
          (item.location || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (filters.category === 'cues' && item.itemType !== 'cue') return false;
        if (filters.category === 'cases' && item.itemType !== 'case') return false;
      }

      // Condition filter
      if (filters.condition && filters.condition !== 'all') {
        if (item.condition !== filters.condition) return false;
      }

      // Cue type filter
      if (filters.cueType && filters.cueType !== 'all') {
        if (item.itemType !== 'cue') return false;
        const itemCueType = (item.cueType ?? item.cue_type ?? '').toString().toLowerCase();
        if (itemCueType !== filters.cueType.toLowerCase()) return false;
      }

      // Price range filter
      const price = Number(item.price || 0);
      if (price < filters.priceMin || price > filters.priceMax) return false;

      return true;
    }
  );

  const { sortBy, setSortBy, sorted } = useSorting(filteredItems, 'newest');
  const pagination = usePagination(sorted, 10);

  return {
    filters,
    setFilter,
    clearFilters,
    sortBy,
    setSortBy,
    ...pagination
  };
}
