import React from 'react';
import { BaseModal, FormField } from '../../../shared/components';

/**
 * ForumNewPostModal - Modal to create a new post/reply
 * Now uses BaseModal to eliminate duplication
 *
 * @component
 * @param {boolean} isOpen - Whether modal is open
 * @param {string} content - Post content
 * @param {Function} onContentChange - Callback to update content
 * @param {Function} onSubmit - Callback to submit form
 * @param {Function} onClose - Callback to close modal
 * @param {boolean} loading - Whether form is loading
 */
export default function ForumNewPostModal({
  isOpen,
  content,
  onContentChange,
  onSubmit,
  onClose,
  loading,
}) {
  return (
    <BaseModal
      isOpen={isOpen}
      title="Post Reply"
      onSubmit={onSubmit}
      onClose={onClose}
      submitText="Post Reply"
      loading={loading}
      variant="blue"
    >
      {/* Content Textarea */}
      <FormField label="Your Reply">
        <textarea
          placeholder="Write your reply here..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
        />
      </FormField>
    </BaseModal>
  );
}
