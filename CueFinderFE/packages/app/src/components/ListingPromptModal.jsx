import React from 'react';
import { Button } from './ui/button';

// Helper to get full image URL from image object
const getImageUrl = (img, SITE_BASE_URL = '') => {
  if (!img) return '/placeholder.png';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '/placeholder.png';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  return url;
};

/**
 * ListingPromptModal
 * Props:
 * - listing: { title, images, ... }
 * - onKeepActive: () => void
 * - onHide: () => void
 * - onClose: () => void
 * - SITE_BASE_URL: string (optional)
 */
export default function ListingPromptModal({ listing, onKeepActive, onHide, onClose, SITE_BASE_URL = '' }) {
  if (!listing) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-background rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-2 text-center">Listing Needs Attention</h2>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          This listing has been active for a while. Would you like to keep it active?
        </p>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {listing.images && listing.images.length > 0 ? (
              listing.images.map((img, idx) => (
                <div key={img.id || idx} className="w-24 h-24 rounded-lg overflow-hidden border border-border bg-slate-100 flex items-center justify-center">
                  <img
                    src={getImageUrl(img, SITE_BASE_URL)}
                    alt={listing.title || 'Listing'}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))
            ) : (
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-border bg-slate-100 flex items-center justify-center text-muted-foreground">
                No images
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button className="w-full sm:w-auto" onClick={onKeepActive}>
            Keep Active
          </Button>
          <Button className="w-full sm:w-auto" variant="outline" onClick={onHide}>
            Hide Listing
          </Button>
        </div>
      </div>
    </div>
  );
}
