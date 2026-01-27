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
  const itemsPerPage = 10;

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
    <Card className="bg-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4">Users</h3>

        {/* Search and filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <MaterialInput
            placeholder="Search users (name or email)"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            style={{ minWidth: '250px' }}
          />
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
            Total: {users.length}
          </span>
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
            Filtered: {filteredUsers.length}
          </span>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left font-bold text-gray-900 text-xs sm:text-sm">
                  Name
                </th>
                <th className="px-2 sm:px-4 py-3 text-left font-bold text-gray-900 text-xs sm:text-sm">
                  Role
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
              {paginatedUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={onEdit}
                  onToggleBan={onToggleBan}
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
