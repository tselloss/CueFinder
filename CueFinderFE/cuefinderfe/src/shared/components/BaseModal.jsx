import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';

/**
 * BaseModal - Reusable modal wrapper component
 * Eliminates duplication between ForumNewDiscussionModal and ForumNewPostModal
 *
 * @component
 * @param {boolean} isOpen - Whether modal is visible
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal body content
 * @param {Function} onSubmit - Submit button callback
 * @param {Function} onClose - Close button callback
 * @param {boolean} [loading=false] - Show loading state
 * @param {string} [submitText='Submit'] - Submit button text
 * @param {string} [cancelText='Cancel'] - Cancel button text
 * @param {string} [variant='purple'] - Color variant ('purple', 'blue', 'green')
 *
 * @example
 * <BaseModal
 *   isOpen={isOpen}
 *   title="Create Discussion"
 *   onSubmit={handleSubmit}
 *   onClose={handleClose}
 *   submitText="Create"
 * >
 *   <input placeholder="Title" />
 * </BaseModal>
 */
export default function BaseModal({
  isOpen,
  title,
  children,
  onSubmit,
  onClose,
  loading = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  variant = 'purple',
}) {
  if (!isOpen) return null;

  const variantConfig = {
    purple: {
      border: 'border-purple-500/30',
      shadow: 'shadow-purple-500/20',
      button: 'from-purple-600 to-purple-700',
    },
    blue: {
      border: 'border-blue-500/30',
      shadow: 'shadow-blue-500/20',
      button: 'from-blue-600 to-blue-700',
    },
    green: {
      border: 'border-green-500/30',
      shadow: 'shadow-green-500/20',
      button: 'from-green-600 to-green-700',
    },
  };

  const config = variantConfig[variant] || variantConfig.purple;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-slate-900 border-2 ${config.border} rounded-2xl shadow-2xl ${config.shadow} max-w-lg w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b border-slate-700 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-6 bg-gradient-to-b ${config.button} rounded-full`} />
            <h2 className="text-xl font-bold text-slate-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">{children}</div>

        {/* Modal Footer */}
        <div className="border-t border-slate-700 p-6 flex gap-3 justify-end bg-slate-800/30">
          <Button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg transition-all"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className={`px-6 py-2 bg-gradient-to-r ${config.button} text-white font-semibold rounded-lg hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
          >
            {submitText}
          </Button>
        </div>
      </div>
    </div>
  );
}
