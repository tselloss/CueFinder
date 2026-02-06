import React, { useMemo } from 'react';
import { Card, CardContent } from '../../../components/ui/card.jsx';
import MaterialInput from '../../../components/MaterialInput';
import AdminTabs from './AdminTabs';
import ListingRow from './ListingRow';
import Pagination from './Pagination';

export default function ListingsManagementView({
  listings,
  query,
  onQueryChange,
  activeTab,
  onTabChange,
  page,
  onPageChange,
  onFlag,
  onDelete,
}) {
  const itemsPerPage = 5;

  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(l =>
      !q || l.title.toLowerCase().includes(q) || String(l.price).includes(q)
    );
  }, [listings, query]);

  const paginatedListings = useMemo(() => {
    let data = filteredListings;
    if (activeTab === 'cues') {
      data = filteredListings.filter(l => l.itemType === 'cue');
    } else if (activeTab === 'cases') {
      data = filteredListings.filter(l => l.itemType === 'case');
    } else if (activeTab === 'tables') {
      data = filteredListings.filter(l => l.itemType === 'table');
    } else if (activeTab === 'accessories') {
      data = filteredListings.filter(l => l.itemType === 'accessory');
    }
    const start = (page - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [filteredListings, page, activeTab]);

  const totalPages = useMemo(() => {
    let data = filteredListings;
    if (activeTab === 'cues') {
      data = filteredListings.filter(l => l.itemType === 'cue');
    } else if (activeTab === 'cases') {
      data = filteredListings.filter(l => l.itemType === 'case');
    } else if (activeTab === 'tables') {
      data = filteredListings.filter(l => l.itemType === 'table');
    } else if (activeTab === 'accessories') {
      data = filteredListings.filter(l => l.itemType === 'accessory');
    }
    return Math.ceil(data.length / itemsPerPage);
  }, [filteredListings, activeTab]);

  return (
    <Card className="bg-slate-800 shadow-lg border border-slate-700">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-slate-100">Listings Management</h3>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900 border border-blue-700 text-blue-300 text-sm font-medium rounded-lg">
              📊 Total: <strong>{listings.length}</strong>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-900 border border-green-700 text-green-300 text-sm font-medium rounded-lg">
              🔍 Filtered: <strong>{filteredListings.length}</strong>
            </span>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-4 sm:mb-6">
          <MaterialInput
            placeholder="🔍 Search listings by title or price..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            style={{ minWidth: '100%' }}
            className="w-full"
          />
        </div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <AdminTabs activeTab={activeTab} onTabChange={(tab) => {
            onTabChange(tab);
            onPageChange(1);
          }} />
        </div>

        {/* Listings Table */}
        {paginatedListings.length > 0 ? (
          <div className="overflow-x-auto border border-slate-700 rounded-lg bg-slate-800">
            <table className="w-full text-xs sm:text-sm min-w-[680px]">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-4 text-left font-bold text-slate-200 text-[11px] sm:text-xs uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-4 text-left font-bold text-slate-200 text-[11px] sm:text-xs uppercase tracking-wider">
                    Price (€)
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-4 text-left font-bold text-slate-200 text-[11px] sm:text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-4 text-left font-bold text-slate-200 text-[11px] sm:text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {paginatedListings.map((item, idx) => (
                  <ListingRow
                    key={item.uid}
                    item={item}
                    onFlag={onFlag}
                    onDelete={onDelete}
                    isAltRow={idx % 2 === 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center border border-slate-700 rounded-lg bg-slate-750">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-slate-300 font-medium mb-1">No listings found</p>
            <p className="text-slate-400 text-sm">{query ? `Try adjusting your search "${query}"` : 'No listings to display'}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPrevious={() => onPageChange(Math.max(1, page - 1))}
            onNext={() => onPageChange(Math.min(totalPages, page + 1))}
            onPageChange={onPageChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
