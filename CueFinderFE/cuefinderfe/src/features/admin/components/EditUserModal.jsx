import React from 'react';
import { Button } from '../../../components/ui/button.jsx';
import { BaseModal } from '../../../shared/components';

export default function EditUserModal({ user, onSave, onClose }) {
  const [editData, setEditData] = React.useState(user || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editData);
  };

  return (
    <BaseModal isOpen={!!user} title="Edit User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Name
          </label>
          <input
            type="text"
            value={editData.name || ''}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Email
          </label>
          <input
            type="email"
            value={editData.email || ''}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Role Field */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Role
          </label>
          <select
            value={editData.role || 'user'}
            onChange={(e) => setEditData({ ...editData, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </BaseModal>
  );
}
