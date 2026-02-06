import React from 'react';
import { Button } from '../../../components/ui/button.jsx';
import { BaseModal } from '../../../shared/components';

export default function EditUserModal({ user, onSave, onClose }) {
  const [editData, setEditData] = React.useState(user || {});
  const [showPasswordSection, setShowPasswordSection] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const validatePassword = () => {
    if (!editData.newPassword) return true;
    if (editData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (editData.newPassword !== editData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    
    setIsLoading(true);
    try {
      await onSave(editData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal isOpen={!!user} title="Edit User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-white">
        {/* User Info Section */}
        <div className="space-y-4 pb-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">User Information</h3>
          
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Full Name
            </label>
            <input
              type="text"
              value={editData.name || ''}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              onCopy={() => {}}
              onCut={() => {}}
              onPaste={() => {}}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter full name"
            />
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={editData.username || ''}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              onCopy={() => {}}
              onCut={() => {}}
              onPaste={() => {}}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter username"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={editData.email || ''}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              onCopy={() => {}}
              onCut={() => {}}
              onPaste={() => {}}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter email"
            />
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Role
            </label>
            <select
              value={editData.role || 'user'}
              onChange={(e) => setEditData({ ...editData, role: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
            >
              <option value="user">User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        {/* Password Section */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setShowPasswordSection(!showPasswordSection);
              setPasswordError('');
              setEditData({ ...editData, newPassword: '', confirmPassword: '' });
            }}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition"
          >
            {showPasswordSection ? '▼' : '▶'} 
            <span>Change Password</span>
          </button>

          {showPasswordSection && (
            <div className="space-y-4 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900">Set New Password</h3>
              
              {passwordError && (
                <div className="p-3 bg-red-100 border border-red-400 rounded-lg text-sm text-red-800 flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">⚠</span>
                  <span>{passwordError}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  New Password
                </label>
                <input
                  type="password"
                  value={editData.newPassword || ''}
                  onChange={(e) => {
                    setEditData({ ...editData, newPassword: e.target.value });
                    if (passwordError) setPasswordError('');
                  }}
                  onCopy={() => {}}
                  onCut={() => {}}
                  onPaste={() => {}}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="At least 8 characters"
                />
                <p className="text-xs text-gray-600 mt-1">Minimum 8 characters required</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={editData.confirmPassword || ''}
                  onChange={(e) => {
                    setEditData({ ...editData, confirmPassword: e.target.value });
                    if (passwordError) setPasswordError('');
                  }}
                  onCopy={() => {}}
                  onCut={() => {}}
                  onPaste={() => {}}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="px-6"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
