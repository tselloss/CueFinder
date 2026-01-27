import React from 'react';

/**
 * FormField - Reusable form field component
 * Wraps inputs, textareas, selects with consistent styling
 *
 * @component
 * @param {string} label - Field label
 * @param {React.ReactNode} children - Input element(s)
 * @param {string} [error] - Error message to display
 * @param {string} [helperText] - Helper text below field
 *
 * @example
 * <FormField label="Title">
 *   <input type="text" placeholder="Enter title" />
 * </FormField>
 */
export default function FormField({
  label,
  children,
  error,
  helperText,
}) {
  return (
    <div>
      {label && (
        <label className="text-sm font-semibold text-slate-300 mb-2 block">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {helperText && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
}
