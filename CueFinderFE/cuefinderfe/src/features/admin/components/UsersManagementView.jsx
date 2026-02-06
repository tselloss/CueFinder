import React, { useMemo } from 'react';
import { Card, CardContent } from '../../../components/ui/card.jsx';
import MaterialInput from '../../../components/MaterialInput';
import UserRow from './UserRow';
import Pagination from './Pagination';

export default function UsersManagementView({
  users,
  query,
  onQueryChange,
  page,
  onPageChange,
  onEdit,
  onToggleBan,
  onDelete,
}) {
  const itemsPerPage = 5;

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u =>
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <Card className="bg-slate-800 shadow-lg border border-slate-700">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-slate-100">Users Management</h3>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900 border border-blue-700 text-blue-300 text-sm font-medium rounded-lg">
              📊 Total: <strong>{users.length}</strong>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-900 border border-green-700 text-green-300 text-sm font-medium rounded-lg">
              🔍 Filtered: <strong>{filteredUsers.length}</strong>
            </span>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-6">
          <MaterialInput
            placeholder="🔍 Search users by name or email..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            style={{ minWidth: '100%' }}
            className="w-full"
          />
        </div>

        {/* Users Table */}
        {paginatedUsers.length > 0 ? (
          <div className="overflow-x-auto border border-slate-700 rounded-lg bg-slate-800">
            <table className="w-full text-xs sm:text-sm min-w-[640px]">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                <tr>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {paginatedUsers.map((user, idx) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={onEdit}
                    onToggleBan={onToggleBan}
                    onDelete={onDelete}
                    isAltRow={idx % 2 === 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-gray-600 font-medium mb-1">No users found</p>
            <p className="text-gray-500 text-sm">{query ? `Try adjusting your search "${query}"` : 'No users to display'}</p>
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
