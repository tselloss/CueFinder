import React from 'react';
import CueFormWizard from '../components/wizard/CueFormWizard';

/**
 * CueFormModal - Wrapper component for the listing form wizard
 * Now uses the multi-step CueFormWizard component for better UX
 * 
 * @param {Object} cue - Existing listing to edit (null for new listing)
 * @param {Function} onClose - Callback when modal is closed
 * @param {Function} onSave - Callback when listing is saved
 */
export default function CueFormModal({ cue, onClose, onSave }) {
  return <CueFormWizard cue={cue} onClose={onClose} onSave={onSave} />;
}
