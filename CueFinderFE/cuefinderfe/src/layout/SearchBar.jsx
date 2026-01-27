import React, { useState } from 'react';
import { Button } from '../components/ui/button.jsx';
import { Search, X } from 'lucide-react';

/**
 * Material Design Search Bar Component
 * Unified search interface for both mobile and desktop views
 * 
 * Features:
 * - Consistent behavior across all screen sizes
 * - Clean, minimalist Material Design pattern
 * - Responsive sizing and spacing
 * - Icon indicators for focus and interaction states
 */
export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search cues, brands...',
  onClear,
  isMobile = false 
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange({ target: { value: '' } });
    if (onClear) onClear();
  };

  return (
    <div
      className={`w-full ${isMobile ? 'max-w-none' : 'max-w-3xl'} transition-all duration-300 flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 ${
        isFocused 
          ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
          : 'border-blue-300 shadow-md'
      }`}
      style={{
        minHeight: isMobile ? '40px' : '56px',
        backgroundColor: isMobile ? 'rgba(30, 41, 59, 0.9)' : '#ffffff',
        cursor: 'text'
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Search Icon */}
      <Search 
        size={isMobile ? 18 : 20} 
        className={`flex-shrink-0 transition-colors ${
          isFocused ? 'text-blue-500' : 'text-blue-300'
        }`}
      />

      {/* Input Field */}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`flex-1 min-w-0 border-none bg-transparent outline-none text-base md:text-base font-normal transition-colors ${
          isMobile ? 'text-slate-100' : 'text-foreground'
        } placeholder-slate-400`}
      />

      {/* Clear Button - Only show when there's text */}
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="flex-shrink-0 h-6 w-6 hover:scale-110 transition-transform"
        >
          <X size={isMobile ? 16 : 18} className="text-slate-400 hover:text-slate-600" />
        </Button>
      )}
    </div>
  );
}
