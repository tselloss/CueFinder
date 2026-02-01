import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../../contexts/ToastContext';

/**
 * Admin Moderation Dashboard for reviewing flagged images
 */
const ModerationDashboard = () => {
  const { showSuccess, showError } = useToast();
  const [flags, setFlags] = useState([]);
  const [rejectedImages, setRejectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [banUser, setBanUser] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'rejected'

  // Fetch pending flags on mount
  useEffect(() => {
    fetchPendingFlags();
    fetchRejectedImages();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPendingFlags();
      fetchRejectedImages();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingFlags = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ext/moderation/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFlags(response.data.items || []);
    } catch (error) {
      console.error('Error fetching flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRejectedImages = async () => {
    try {
      const response = await axios.get('/api/ext/moderation/flagged-images?status=rejected', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRejectedImages(response.data.items || []);
    } catch (error) {
      console.error('Error fetching rejected images:', error);
    }
  };

  const handleApprove = async (flagId) => {
    if (!window.confirm('✅ Έγκριση αυτής της εικόνας;\n\nΑυτό θα κάνει την εικόνα δημόσια και θα την αφαιρέσει από την ουρά ελέγχου.')) return;

    try {
      setActionInProgress(true);
      await axios.post(`/api/ext/moderation/approve/${flagId}`, 
        { notes: adminNotes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setFlags(flags.filter(f => f.id !== flagId));
      setSelectedFlag(null);
      setAdminNotes('');
      showSuccess('✅ Η εικόνα εγκρίθηκε επιτυχώς');
    } catch (error) {
      console.error('Error approving:', error);
      showError('❌ Αδυναμία έγκρισης εικόνας. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async (flagId) => {
    if (!window.confirm(`⚠️ Απόρριψη αυτής της εικόνας;${banUser ? '\n\n🚫 Αυτό θα ΑΠΟΚΛΕΙΣΕΙ επίσης τον χρήστη από την ανάρτηση μελλοντικών εικόνων!' : '\n\nΗ εικόνα θα αφαιρεθεί οριστικά.'}`)) return;

    try {
      setActionInProgress(true);
      await axios.post(`/api/ext/moderation/reject/${flagId}`,
        { notes: adminNotes, banUser },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setFlags(flags.filter(f => f.id !== flagId));
      setSelectedFlag(null);
      setAdminNotes('');
      setBanUser(false);
      showSuccess('✅ Η εικόνα απορρίφθηκε' + (banUser ? ' και ο χρήστης αποκλείστηκε' : ' επιτυχώς'));
    } catch (error) {
      console.error('Error rejecting:', error);
      showError('❌ Αδυναμία απόρριψης εικόνας. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Load image preview for selected flag
  const [flagPreviewUrl, setFlagPreviewUrl] = useState(null);
  useEffect(() => {
    const loadPreview = async () => {
      if (!selectedFlag) { setFlagPreviewUrl(null); return; }
      try {
        const response = await axios.get(`/api/ext/moderation/flagged/${selectedFlag.id}/image`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          responseType: 'blob'
        });
        const url = URL.createObjectURL(response.data);
        setFlagPreviewUrl(url);
      } catch (err) {
        console.error('Failed to load preview image:', err);
        setFlagPreviewUrl(null);
      }
    };
    loadPreview();
    return () => {
      if (flagPreviewUrl) URL.revokeObjectURL(flagPreviewUrl);
    };
  }, [selectedFlag]);

  return (
    <div className="moderation-dashboard p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 mt-2">Πίνακας Ελέγχου Διαχείρισης</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === 'pending'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Εκκρεμεί ({flags.length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === 'rejected'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Απορρίφθηκε ({rejectedImages.length})
        </button>
      </div>

      {loading && <p className="text-gray-600">Φόρτωση...</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flags List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === 'pending' ? `Εκκρεμεί (${flags.length})` : `Απορρίφθηκε (${rejectedImages.length})`}
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activeTab === 'pending' ? (
              flags.length === 0 ? (
                <p className="text-gray-500">Δεν υπάρχουν εκκρεμείς σημαίες</p>
              ) : (
                flags.map(flag => (
                  <button
                    key={flag.id}
                    onClick={() => setSelectedFlag(flag)}
                    className={`w-full text-left p-3 rounded transition ${
                      selectedFlag?.id === flag.id
                        ? 'bg-blue-100 border-l-4 border-blue-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-sm font-semibold">{flag.reason}</div>
                    <div className="text-xs text-gray-600">
                      Χρήστης: {flag.user_name} ({flag.user_id})
                    </div>
                    <div className="text-xs text-gray-600">
                      Εμπιστοσύνη: {(flag.confidence * 100).toFixed(0)}%
                    </div>
                  </button>
                ))
              )
            ) : (
              rejectedImages.length === 0 ? (
                <p className="text-gray-500">Δεν υπάρχουν απορριφθείσες εικόνες</p>
              ) : (
                rejectedImages.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-red-50 border-l-4 border-red-500 rounded"
                  >
                    <div className="text-sm font-semibold text-red-700">{item.reason}</div>
                    <div className="text-xs text-gray-600">
                      Χρήστης: {item.user_name}
                    </div>
                    <div className="text-xs text-gray-600">
                      Απορρίφθηκε: {new Date(item.flagged_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-600">
                      Εμπιστοσύνη: {(item.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Flag Details & Actions */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedFlag ? (
            <>
              <h2 className="text-2xl font-bold mb-4">Λεπτομέρειες Ελέγχου</h2>

              {/* Flag Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">Λόγος Σήμανσης</p>
                  <p className="font-semibold capitalize">{selectedFlag.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Εμπιστοσύνη AI</p>
                  <p className="font-semibold">
                    {(selectedFlag.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Χρήστης Αποστολής</p>
                  <p className="font-semibold">{selectedFlag.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Σχετικό Στοιχείο</p>
                  <p className="font-semibold">
                    {selectedFlag.cue_id ? `Μπιλιάρδου #${selectedFlag.cue_id}` : 
                     selectedFlag.cue_case_id ? `Θήκη #${selectedFlag.cue_case_id}` : 
                     'Αυτόνομο'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Σημάνθηκε Στις</p>
                  <p className="font-semibold text-sm">
                    {new Date(selectedFlag.flagged_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              <div className="mb-6 p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-600 mb-2">Προεπισκόπηση Εικόνας:</p>
                {flagPreviewUrl ? (
                  <img src={flagPreviewUrl} alt="Προεπισκόπηση σημαίας" className="max-h-64 rounded border" />
                ) : (
                  <div className="text-sm text-gray-700 truncate">(Προεπισκόπηση μη διαθέσιμη)</div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Σημειώσεις Διαχειριστή
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows="3"
                  placeholder="Εισάγετε τις σημειώσεις της απόφασής σας..."
                />
              </div>

              {/* Ban User Checkbox */}
              <div className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  id="ban_user"
                  checked={banUser}
                  onChange={(e) => setBanUser(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="ban_user" className="text-sm font-semibold">
                  Αποκλεισμός χρήστη από την πλατφόρμα (εάν απορρίπτεται)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedFlag.id)}
                  disabled={actionInProgress}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded transition"
                >
                  ✓ Έγκριση
                </button>
                <button
                  onClick={() => handleReject(selectedFlag.id)}
                  disabled={actionInProgress}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded transition"
                >
                  ✗ Απόρριψη
                </button>
                <button
                  onClick={() => setSelectedFlag(null)}
                  disabled={actionInProgress}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded transition"
                >
                  Παράλειψη
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Επιλέξτε μια σημαία για έλεγχο
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;
