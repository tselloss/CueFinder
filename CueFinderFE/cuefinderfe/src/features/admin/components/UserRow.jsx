import React from 'react';
import { Check, Edit2, Trash2, X, User } from 'lucide-react';
import { Button } from '../../../components/ui/button.jsx';

export default function UserRow({ user, onEdit, onToggleBan, onDelete }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-2 sm:px-4 py-3">
        <div>
          <p className="font-bold text-gray-900 text-xs sm:text-sm">{user.name}</p>
          <p className="text-gray-500 text-[10px] sm:text-xs">{user.email}</p>
        </div>
      </td>
      <td className="px-2 sm:px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
            user.role === 'admin'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <User className="w-3 h-3" />
          {user.role}
        </span>
      </td>
      <td className="px-2 sm:px-4 py-3">
        <span
          className={`inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-white ${
            user.isActive === false ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {user.isActive === false ? 'INACTIVE' : 'ACTIVE'}
        </span>
      </td>
      <td className="px-2 sm:px-4 py-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(user)}
            title="Edit"
            className="min-w-[44px] min-h-[44px] sm:w-8 sm:h-8 p-0 touch-manipulation"
          >
            <Edit2 className="w-4 h-4 sm:w-4 sm:h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleBan(user)}
            title={user.isActive === false ? 'Activate' : 'Disable'}
            className="min-w-[44px] min-h-[44px] sm:w-8 sm:h-8 p-0 touch-manipulation"
          >
            {user.isActive === false ? (
              <Check className="w-4 h-4 sm:w-4 sm:h-4 text-green-600" />
            ) : (
              <X className="w-4 h-4 sm:w-4 sm:h-4 text-red-600" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(user.id)}
            title="Delete"
            className="min-w-[44px] min-h-[44px] sm:w-8 sm:h-8 p-0 touch-manipulation"
          >
            <Trash2 className="w-4 h-4 sm:w-4 sm:h-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
