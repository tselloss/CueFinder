import CueFormWizard from '../features/cues/components/wizard/CueFormWizard';

export default function CueFormModal({ cue, onClose, onSave }) {
  return <CueFormWizard cue={cue} onClose={onClose} onSave={onSave} />;
}
