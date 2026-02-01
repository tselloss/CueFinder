import React from 'react';

/**
 * PageHeader - Reusable page/section header component
 * Used in categories view, discussions view, detail view
 *
 * @component
 * @param {string} title - Main title
 * @param {string} [subtitle] - Optional subtitle
 * @param {React.ReactNode} [actions] - Action buttons/controls
 * @param {React.ReactNode} [icon] - Optional icon
 *
 * @example
 * <PageHeader
 *   title="Community Forum"
 *   subtitle="Connect with the billiards community"
 *   icon={<MessageCircle size={32} />}
 *   actions={<Button>Create New</Button>}
 * />
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  icon,
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6">
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="text-3xl">{icon}</div>}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-purple-400">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
  );
}
