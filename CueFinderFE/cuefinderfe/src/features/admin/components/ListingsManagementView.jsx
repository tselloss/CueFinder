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
  const itemsPerPage = 10;

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
    }
    return Math.ceil(data.length / itemsPerPage);
  }, [filteredListings, activeTab]);

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4">Listings</h3>

        {/* Search and filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <MaterialInput
            placeholder="Search listings (title or price)"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            style={{ minWidth: '250px' }}
          />
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
            Total: {listings.length}
          </span>
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
            Filtered: {filteredListings.length}
          </span>
        </div>

        {/* Tabs */}
        <AdminTabs activeTab={activeTab} onTabChange={(tab) => {
          onTabChange(tab);
          onPageChange(1);
        }} />

        {/* Listings Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left font-bold text-gray-900 text-xs sm:text-sm">
                  Title
                </th>
                <th className="px-2 sm:px-4 py-3 text-left font-bold text-gray-900 text-xs sm:text-sm">
                  Price (€)
                </th>
                <th className="px-2 sm:px-4 py-3 text-left font-bold text-gray-900 text-xs sm:text-sm">
                  Status
                </th>
                <th className="px-2 sm:px-4 py-3 text-left font-bold text-gray-900 text-xs sm:text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedListings.map((item) => (
                <ListingRow
                  key={item.uid}
                  item={item}
                  onFlag={onFlag}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPrevious={() => onPageChange(Math.max(1, page - 1))}
          onNext={() => onPageChange(Math.min(totalPages, page + 1))}
        />
      </CardContent>
    </Card>
  );
}
