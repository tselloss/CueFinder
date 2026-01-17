import React, { useState } from 'react';
import { Box, TextInput, Button } from 'grommet';
import { Close, Search } from 'grommet-icons';

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
      iconSize: '14px'
    },
    medium: {
      height: '44px',
      padding: '10px 14px',
      fontSize: '14px',
      iconSize: '18px'
    },
    large: {
      height: '52px',
      padding: '12px 16px',
      fontSize: '15px',
      iconSize: '20px'
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
    <Box
      direction="row"
      align="center"
      background={getBackgroundColor()}
      pad={{ horizontal: 'small', vertical: '0px' }}
      style={{
        height: config.height,
        width: fullWidth ? '100%' : 'auto',
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isFocused
          ? `0 4px 12px rgba(59, 130, 246, 0.15)`
          : '0 1px 3px rgba(0, 0, 0, 0.08)',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'text',
        position: 'relative',
        zIndex: 10
      }}
      onFocus={() => !disabled && setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      gap="xsmall"
    >
      {/* Leading Icon */}
      {IconComponent && (
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: isFocused ? '#60a5fa' : '#93c5fd',
            transition: 'color 0.2s ease'
          }}
        >
          <IconComponent size={config.iconSize} />
        </Box>
      )}

      {/* Input Field */}
      <TextInput
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
        plain
        style={{
          fontSize: config.fontSize,
          fontWeight: 400,
          border: 'none',
          background: 'transparent',
          color: '#f1f5f9',
          flex: 1,
          minWidth: 0,
          padding: 0,
          outline: 'none',
          ...style
        }}
        {...props}
      />

      {/* Clear Button - Only show when there's text */}
      {value && onClear && !disabled && (
        <Button
          plain
          icon={<Close size={config.iconSize} color="#cbd5e1" />}
          onClick={handleClear}
          style={{
            padding: '0',
            minWidth: 'auto',
            minHeight: 'auto',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      )}
    </Box>
  );
}
