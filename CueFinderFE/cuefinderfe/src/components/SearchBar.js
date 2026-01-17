import React, { useState } from 'react';
import { Box, TextInput, Button } from 'grommet';
import { Search, Close } from 'grommet-icons';

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
    <Box
      className={`search-bar-container ${isMobile ? 'search-bar-mobile' : 'search-bar-desktop'}`}
      direction="row"
      align="center"
      background={isMobile ? 'rgba(30, 41, 59, 0.9)' : 'background-front'}
      pad={isMobile ? { horizontal: 'small', vertical: 'xsmall' } : { horizontal: 'medium', vertical: 'small' }}
      round={isMobile ? 'small' : 'medium'}
      border={{
        color: isFocused 
          ? 'rgba(59, 130, 246, 0.6)' 
          : 'rgba(59, 130, 246, 0.3)',
        size: '2px'
      }}
      gap={isMobile ? 'xsmall' : 'small'}
      style={{
        width: '100%',
        maxWidth: isMobile ? 'none' : '800px',
        minHeight: isMobile ? '40px' : '56px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isFocused 
          ? isMobile 
            ? '0 2px 8px rgba(59, 130, 246, 0.2)' 
            : '0 4px 20px rgba(59, 130, 246, 0.25)'
          : isMobile 
            ? 'none' 
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: 'text'
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Search Icon */}
      <Search 
        size={isMobile ? '18px' : '20px'} 
        color={isFocused ? '#60a5fa' : '#93c5fd'}
        style={{
          flexShrink: 0,
          transition: 'color 0.2s ease',
        }}
      />

      {/* Input Field */}
      <TextInput
        className="search-input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        plain
        style={{
          fontSize: isMobile ? '14px' : '15px',
          fontWeight: 400,
          border: 'none',
          background: 'transparent',
          color: '#f1f5f9',
          flex: 1,
          minWidth: 0,
          padding: 0,
          outline: 'none'
        }}
      />

      {/* Clear Button - Only show when there's text */}
      {value && (
        <Button
          className="search-clear-button"
          plain
          icon={<Close size={isMobile ? '16px' : '18px'} color="#cbd5e1" />}
          onClick={handleClear}
          style={{
            padding: '0',
            minWidth: 'auto',
            minHeight: 'auto',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      )}
    </Box>
  );
}
