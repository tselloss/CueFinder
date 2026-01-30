import React from 'react';
import { BaseModal, FormField } from '../../../shared/components';

/**
 * ForumNewDiscussionModal - Modal to create a new discussion
 * Now uses BaseModal to eliminate duplication
 *
 * @component
 * @param {boolean} isOpen - Whether modal is open
 * @param {Object} formData - Form data object { title, content, categoryId }
 * @param {Function} onFormChange - Callback to update form data
 * @param {Array} categories - Available categories
 * @param {Function} onSubmit - Callback to submit form
 * @param {Function} onClose - Callback to close modal
 * @param {boolean} loading - Whether form is loading
 */
export default function ForumNewDiscussionModal({
  isOpen,
  formData,
  onFormChange,
  categories,
  onSubmit,
  onClose,
  loading,
}) {
  return (
    <BaseModal
      isOpen={isOpen}
      title="Δημιουργία Νέου Θέματος"
      onSubmit={onSubmit}
      onClose={onClose}
      submitText="Δημιουργία Θέματος"
      loading={loading}
      variant="blue"
    >
      {/* Category Select */}
      <FormField label="Κατηγορία">
        <select
          value={formData.categoryId}
          onChange={(e) => onFormChange('categoryId', e.target.value)}
          className="w-full px-3 py-2 border border-blue-500/30 rounded-lg bg-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">Επιλέξτε κατηγορία</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>

      {/* Title Input */}
      <FormField label="Τίτλος">
        <input
          type="text"
          placeholder="Τίτλος συζήτησης"
          value={formData.title}
          onChange={(e) => onFormChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
        />
      </FormField>

      {/* Content Textarea */}
      <FormField label="Περιεχόμενο">
        <textarea
          placeholder="Τι θα θέλατε να συζητήσετε;"
          value={formData.content}
          onChange={(e) => onFormChange('content', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
        />
      </FormField>
    </BaseModal>
  );
}
