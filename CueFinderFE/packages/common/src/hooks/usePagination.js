import { useState, useMemo } from 'react';

/**
 * usePagination Hook
 * Manages pagination state and returns paginated items
 * 
 * @param {Array} items - Items to paginate
 * @param {number} itemsPerPage - Number of items per page (default: 10)
 * @returns {Object} { page, setPage, paginated, total, canNextPage, canPrevPage }
 */
export function usePagination(items, itemsPerPage = 10) {
  const [page, setPage] = useState(1);
  
  const result = useMemo(() => {
    const total = Math.ceil((items?.length || 0) / itemsPerPage);
    const validPage = Math.min(Math.max(1, page), total || 1);
    const start = (validPage - 1) * itemsPerPage;
    const paginated = (items || []).slice(start, start + itemsPerPage);
    
    return {
      page: validPage,
      setPage: (p) => {
        const newPage = typeof p === 'function' ? p(validPage) : p;
        setPage(Math.max(1, newPage));
      },
      paginated,
      total,
      canNextPage: validPage < total,
      canPrevPage: validPage > 1,
      goToPage: (p) => setPage(Math.max(1, Math.min(p, total))),
      nextPage: () => setPage(prev => prev + 1),
      prevPage: () => setPage(prev => Math.max(1, prev - 1))
    };
  }, [items, itemsPerPage, page]);
  
  return result;
}
