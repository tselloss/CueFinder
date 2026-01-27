import React from 'react';

/**
 * EmptyState - Reusable empty state component
 * Used when no items are found in lists
 *
 * @component
 * @param {string} title - Empty state title
 * @param {string} [message='No items found'] - Empty state message
 * @param {React.ReactNode} [icon] - Optional icon to display
 *
 * @example
 * <EmptyState
 *   title="No Discussions"
 *   message="Start a new discussion to get the conversation going"
 * />
 */
export default function EmptyState({
  title,
  message = 'No items found',
  icon,
}) {
  return (
    <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
      {icon && <div className="flex justify-center mb-3 text-2xl">{icon}</div>}
      <p className="text-slate-400">
        <span className="font-semibold text-slate-300">{title}</span>
        {message && <div className="text-sm mt-1">{message}</div>}
      </p>
    </div>
  );
}
