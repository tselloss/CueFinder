import React from 'react';
import { Button } from '../../../components/ui/button.jsx';

export default function Pagination({ currentPage, totalPages, onPrevious, onNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-xs sm:text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 touch-manipulation text-xs sm:text-sm"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 touch-manipulation text-xs sm:text-sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
