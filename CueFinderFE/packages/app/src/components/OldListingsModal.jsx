import React, { useState } from 'react';
import { X, Clock, Trash2, CheckCircle, RefreshCw } from 'lucide-react';

export default function OldListingsModal({ listings, onClose, onKeep, onMarkSold, onDelete }) {
  const [processing, setProcessing] = useState({});

  const handleAction = async (listingId, action, actionFn) => {
    setProcessing(prev => ({ ...prev, [listingId]: action }));
    try {
      await actionFn(listingId);
    } catch (error) {
      console.error(`Error ${action} listing:`, error);
    } finally {
      setProcessing(prev => ({ ...prev, [listingId]: null }));
    }
  };

  const getDaysOld = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (listings.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Old Listings Review</h2>
              <p className="text-sm text-orange-100">
                {listings.length} {listings.length === 1 ? 'listing has' : 'listings have'} been active for over 30 days
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-200">
              📢 Your {listings.length === 1 ? 'listing' : 'listings'} below {listings.length === 1 ? 'has' : 'have'} been active for more than a month.
              Please review and let us know if {listings.length === 1 ? 'it\'s' : 'they\'re'} still available.
            </p>
          </div>

          {listings.map((listing) => (
            <div
              key={listing.uid || listing.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Image */}
                {listing.images && listing.images[0] && (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-24 h-24 object-cover rounded-lg border border-slate-600"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-100 text-lg">{listing.title}</h3>
                      <p className="text-sm text-slate-400">
                        Listed {getDaysOld(listing.createdAt || listing.created_at)} days ago
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-400">€{Number(listing.price || 0).toFixed(2)}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        listing.itemType === 'cue' ? 'bg-blue-900 text-blue-300' :
                        listing.itemType === 'case' ? 'bg-purple-900 text-purple-300' :
                        listing.itemType === 'table' ? 'bg-green-900 text-green-300' :
                        'bg-gray-900 text-gray-300'
                      }`}>
                        {listing.itemType === 'cue' ? '🎱 Cue' :
                         listing.itemType === 'case' ? '📦 Case' :
                         listing.itemType === 'table' ? '🎰 Table' :
                         '⚙️ Accessory'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => handleAction(listing.uid || listing.id, 'keep', onKeep)}
                      disabled={processing[listing.uid || listing.id] === 'keep'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                      title="Keep listing active"
                    >
                      {processing[listing.uid || listing.id] === 'keep' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Keeping...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Keep Active</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction(listing.uid || listing.id, 'sold', onMarkSold)}
                      disabled={processing[listing.uid || listing.id] === 'sold'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                      title="Mark as sold"
                    >
                      {processing[listing.uid || listing.id] === 'sold' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Marking...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Sold</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${listing.title}"? This action cannot be undone.`)) {
                          handleAction(listing.uid || listing.id, 'delete', onDelete);
                        }
                      }}
                      disabled={processing[listing.uid || listing.id] === 'delete'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                      title="Delete listing permanently"
                    >
                      {processing[listing.uid || listing.id] === 'delete' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
          <p className="text-sm text-slate-400 text-center">
            You can review your listings anytime from your profile page
          </p>
        </div>
      </div>
    </div>
  );
}
