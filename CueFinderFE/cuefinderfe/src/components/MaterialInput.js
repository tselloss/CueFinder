import React, { useState } from 'react';
import { Button } from './ui/button';
import { X, Search } from 'lucide-react';

/**
 * Material Design Input Component
 * Unified text input for forms, filters, searches across the app
 * 
 * Features:
 * - Consistent styling across all forms
 * - Focus state with smooth animations
 * - Optional icon indicators
 * - Optional clear button
 * - Responsive sizing
 * - Proper z-index layering
 */
export default function MaterialInput({
  value,
  onChange,
  placeholder,
  icon: iconProp = null, // Can be 'search' or a component
  onClear = null,
  type = 'text',
  disabled = false,
  required = false,
  pattern = null,
  minLength = null,
  maxLength = null,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'outlined', // 'outlined', 'filled'
  fullWidth = false,
  style = {},
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  // Handle icon prop - can be a string ('search') or a component
  const IconComponent = iconProp === 'search' ? Search : iconProp;

  const handleClear = () => {
    onChange({ target: { value: '' } });
    if (onClear) onClear();
  };

  // Size configurations
  const sizeConfig = {
    small: {
      height: '36px',
      padding: '8px 12px',
      fontSize: '12px',
      iconSize: 14
    },
    medium: {
      height: '44px',
      padding: '10px 14px',
      fontSize: '14px',
      iconSize: 18
    },
    large: {
      height: '52px',
      padding: '12px 16px',
      fontSize: '15px',
      iconSize: 20
    }
  };

  const config = sizeConfig[size];

  // Color scheme based on variant
  const getBackgroundColor = () => {
    if (disabled) return 'rgba(100, 100, 100, 0.1)';
    if (variant === 'filled') return 'rgba(30, 41, 59, 0.8)';
    return 'transparent';
  };

  const getBorderColor = () => {
    if (disabled) return 'rgba(100, 100, 100, 0.3)';
    if (isFocused) return 'rgba(59, 130, 246, 0.6)';
    return 'rgba(59, 130, 246, 0.3)';
  };

  return (
    <div
      className={`flex items-center ${fullWidth ? 'w-full' : 'w-auto'} gap-2 px-3 py-0 rounded-lg border-2 transition-all duration-300 relative z-10 ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-text'
      }`}
      style={{
        height: config.height,
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
        boxShadow: isFocused
          ? `0 4px 12px rgba(59, 130, 246, 0.15)`
          : '0 1px 3px rgba(0, 0, 0, 0.08)'
      }}
      onFocus={() => !disabled && setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Leading Icon */}
      {IconComponent && (
        <div
          className={`flex items-center justify-center flex-shrink-0 transition-colors ${
            isFocused ? 'text-blue-400' : 'text-blue-300'
          }`}
        >
          <IconComponent size={config.iconSize} />
        </div>
      )}

      {/* Input Field */}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        required={required}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
        className="flex-1 min-w-0 border-none bg-transparent outline-none text-slate-100 placeholder-slate-400"
        style={{
          fontSize: config.fontSize,
          fontWeight: 400,
          ...style
        }}
        {...props}
      />

      {/* Clear Button - Only show when there's text */}
      {value && onClear && !disabled && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-auto w-auto p-0 flex-shrink-0 hover:scale-110 transition-transform"
        >
          <X size={config.iconSize} className="text-slate-300 hover:text-slate-200" />
        </Button>
      )}
    </div>
  );
}
