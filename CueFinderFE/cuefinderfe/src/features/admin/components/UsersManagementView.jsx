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
  onApproveClubOwner,
  onRejectClubOwner,
}) {
  const itemsPerPage = 5;
  const pendingClubOwners = useMemo(() =>
    users.filter((u) => (u.role || '').toLowerCase() === 'club_owner_pending'),
    [users]
  );
  const approvedClubOwners = useMemo(() =>
    users.filter((u) => (u.role || '').toLowerCase() === 'club_owner'),
    [users]
  );

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
        {(pendingClubOwners.length > 0 || approvedClubOwners.length > 0) && (
          <div className="mb-6 space-y-4">
            {pendingClubOwners.length > 0 && (
              <div className="rounded-lg border border-yellow-600/40 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="text-sm font-semibold text-yellow-300">Club Owner Approvals</h4>
                  <span className="text-xs text-yellow-200">Pending: {pendingClubOwners.length}</span>
                </div>
                <div className="space-y-2">
                  {pendingClubOwners.map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-slate-700 bg-slate-800/60 p-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onApproveClubOwner(user)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => onRejectClubOwner(user)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium rounded-md transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {approvedClubOwners.length > 0 && (
              <div className="rounded-lg border border-green-600/30 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="text-sm font-semibold text-green-300">Approved Club Owners</h4>
                  <span className="text-xs text-green-200">Total: {approvedClubOwners.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {approvedClubOwners.map((user) => (
                    <span key={user.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-900/40 border border-green-700 text-green-200 text-xs font-semibold rounded-full">
                      {user.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
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
        <div className="mb-4 sm:mb-6">
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
                  <th className="px-3 sm:px-4 py-2 sm:py-4 text-left font-bold text-slate-200 text-[11px] sm:text-xs uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-4 text-left font-bold text-slate-200 text-[11px] sm:text-xs uppercase tracking-wider">
                    Role
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
                {paginatedUsers.map((user, idx) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={onEdit}
                    onToggleBan={onToggleBan}
                    onDelete={onDelete}
                    onApproveClubOwner={onApproveClubOwner}
                    onRejectClubOwner={onRejectClubOwner}
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
