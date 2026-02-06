import React from 'react';
import { Button } from '../../../components/ui/button.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPrevious, onNext, onPageChange }) {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Showing page <strong className="text-gray-900">{currentPage}</strong> of <strong className="text-gray-900">{totalPages}</strong>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-1 flex-wrap max-w-full overflow-x-auto">
          {pages.map((page, idx) => (
            page === '...' ? (
              <span key={`dots-${idx}`} className="px-2 py-1.5 text-gray-500">•••</span>
            ) : (
              <button
                key={page}
                onClick={() => {
                  if (page !== currentPage && onPageChange) {
                    onPageChange(page);
                  }
                }}
                disabled={page === currentPage}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title={`Go to page ${page}`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3"
          title="Next page"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
