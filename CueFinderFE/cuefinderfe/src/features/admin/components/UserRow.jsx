import React from 'react';
import { Check, Edit2, Trash2, X, User } from 'lucide-react';

export default function UserRow({ user, onEdit, onToggleBan, onDelete, isAltRow }) {
  return (
    <tr className={`transition-colors ${isAltRow ? 'bg-slate-800' : 'bg-slate-750'} hover:bg-slate-700`}>
      <td className="px-3 sm:px-4 py-2 sm:py-4">
        <div>
          <p className="font-semibold text-slate-100 text-xs sm:text-sm leading-snug">{user.name}</p>
          <p className="text-slate-400 text-[11px] sm:text-xs leading-snug">{user.email}</p>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-4">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold ${
            user.role === 'admin'
              ? 'bg-purple-900 text-purple-300 border border-purple-700'
              : 'bg-slate-700 text-slate-300 border border-slate-600'
          }`}
        >
          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          {user.role === 'admin' ? 'Admin' : 'User'}
        </span>
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-4">
        <span
          className={`inline-block px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold text-white ${
            user.isActive === false ? 'bg-red-600 shadow-sm' : 'bg-green-600 shadow-sm'
          }`}
        >
          {user.isActive === false ? '✕ INACTIVE' : '✓ ACTIVE'}
        </span>
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onEdit(user)}
            title="Edit user"
            className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-colors"
          >
            <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onToggleBan(user)}
            title={user.isActive === false ? 'Activate user' : 'Deactivate user'}
            className={`inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-colors ${
              user.isActive === false
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {user.isActive === false ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            <span>{user.isActive === false ? 'Activate' : 'Deactivate'}</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                onDelete(user.id);
              }
            }}
            title="Delete user"
            className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
