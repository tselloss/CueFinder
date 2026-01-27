import React from 'react';
import { Search } from 'lucide-react';

/**
 * SearchInput - Reusable search input component
 * Used in discussions, cues, and other searchable lists
 *
 * @component
 * @param {string} value - Current search value
 * @param {Function} onChange - Callback when search changes
 * @param {string} [placeholder='Search...'] - Input placeholder
 * @param {string} [className=''] - Additional CSS classes
 *
 * @example
 * <SearchInput
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   placeholder="Search discussions..."
 * />
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 ${className}`}>
      <Search size={18} className="text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-slate-100 placeholder-slate-500 text-sm"
      />
    </div>
  );
}
