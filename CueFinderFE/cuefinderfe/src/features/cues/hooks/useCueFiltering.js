import { useMemo } from 'react';

// Handles filtering and sorting of cues without external dependencies
export function useCueFiltering(
  cues,
  {
    search = '',
    category = 'all',
    condition = 'all',
    cueType = 'all',
    priceRange = [0, Infinity],
    sortBy = 'newest',
  } = {}
) {
  const filteredItems = useMemo(() => {
    const [priceMin, priceMax] = priceRange;
    return (cues || []).filter((item) => {
      const query = search?.toLowerCase?.() || '';

      if (query) {
        const matchesSearch =
          (item.title || '').toLowerCase().includes(query) ||
          (item.brand || '').toLowerCase().includes(query) ||
          (item.location || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (category && category !== 'all') {
        if (category === 'cues' && item.itemType !== 'cue') return false;
        if (category === 'cases' && item.itemType !== 'case') return false;
      }

      if (condition && condition !== 'all' && item.condition !== condition) {
        return false;
      }

      if (cueType && cueType !== 'all') {
        if (item.itemType !== 'cue') return false;
        const itemCueType = (item.cueType ?? item.cue_type ?? '').toString().toLowerCase();
        if (itemCueType !== cueType.toLowerCase()) return false;
      }

      const price = Number(item.price || 0);
      if (price < priceMin || price > priceMax) return false;

      return true;
    });
  }, [cues, search, category, condition, cueType, priceRange]);

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];
    switch (sortBy) {
      case 'price_low':
        return items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      case 'price_high':
        return items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      case 'newest':
      default:
        return items.sort(
          (a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
        );
    }
  }, [filteredItems, sortBy]);

  return {
    filteredItems: sortedItems,
  };
}
