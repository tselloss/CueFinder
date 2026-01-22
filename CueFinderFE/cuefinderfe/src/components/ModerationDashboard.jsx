import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Admin Moderation Dashboard for reviewing flagged images
 */
const ModerationDashboard = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [banUser, setBanUser] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch pending flags on mount
  useEffect(() => {
    fetchPendingFlags();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingFlags, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingFlags = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/moderation/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFlags(response.data.items || []);
    } catch (error) {
      console.error('Error fetching flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (flagId) => {
    if (!window.confirm('Approve this image?')) return;

    try {
      setActionInProgress(true);
      await axios.post(`/api/moderation/approve/${flagId}`, 
        { notes: adminNotes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setFlags(flags.filter(f => f.id !== flagId));
      setSelectedFlag(null);
      setAdminNotes('');
      alert('Image approved');
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async (flagId) => {
    if (!window.confirm(`Reject this image?${banUser ? ' AND ban user?' : ''}`)) return;

    try {
      setActionInProgress(true);
      await axios.post(`/api/moderation/reject/${flagId}`,
        { notes: adminNotes, ban_user: banUser },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setFlags(flags.filter(f => f.id !== flagId));
      setSelectedFlag(null);
      setAdminNotes('');
      setBanUser(false);
      alert('Image rejected' + (banUser ? ' and user banned' : ''));
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="moderation-dashboard p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 mt-2">Moderation Dashboard</h1>

      {loading && <p className="text-gray-600">Loading...</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flags List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">
            Pending ({flags.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {flags.length === 0 ? (
              <p className="text-gray-500">No pending flags</p>
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
                    User: {flag.user_name} ({flag.user_id})
                  </div>
                  <div className="text-xs text-gray-600">
                    Confidence: {(flag.confidence * 100).toFixed(0)}%
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Flag Details & Actions */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedFlag ? (
            <>
              <h2 className="text-2xl font-bold mb-4">Review Details</h2>

              {/* Flag Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">Flag Reason</p>
                  <p className="font-semibold capitalize">{selectedFlag.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">AI Confidence</p>
                  <p className="font-semibold">
                    {(selectedFlag.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upload User</p>
                  <p className="font-semibold">{selectedFlag.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Related Item</p>
                  <p className="font-semibold">
                    {selectedFlag.cue_id ? `Cue #${selectedFlag.cue_id}` : 
                     selectedFlag.cue_case_id ? `Case #${selectedFlag.cue_case_id}` : 
                     'Standalone'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Flagged At</p>
                  <p className="font-semibold text-sm">
                    {new Date(selectedFlag.flagged_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              <div className="mb-6 p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-600 mb-2">Image:</p>
                <div className="text-sm text-gray-700 truncate">
                  {selectedFlag.storage_path}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows="3"
                  placeholder="Enter your decision notes..."
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
                  Ban user from platform (if rejecting)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedFlag.id)}
                  disabled={actionInProgress}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded transition"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(selectedFlag.id)}
                  disabled={actionInProgress}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded transition"
                >
                  ✗ Reject
                </button>
                <button
                  onClick={() => setSelectedFlag(null)}
                  disabled={actionInProgress}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded transition"
                >
                  Skip
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a flag to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;
