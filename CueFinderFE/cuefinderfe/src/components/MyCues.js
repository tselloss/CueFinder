import React, { useState, useEffect } from 'react';
import * as cueService from '../api/cueService';
import CueFormModal from './CueFormModal';
import './MyCues.css';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '/placeholder.png';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '/placeholder.png';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function MyCues() {
  const [myCues, setMyCues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCue, setEditingCue] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadMyCues();
  }, []);

  const loadMyCues = async () => {
    setLoading(true);
    try {
      const cues = await cueService.getMyCues();
      setMyCues(cues);
    } catch (error) {
      showMessage('error', 'Failed to load your cue listings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreateNew = () => {
    setEditingCue(null);
    setShowCreateModal(true);
  };

  const handleEdit = (cue) => {
    setEditingCue(cue);
    setShowCreateModal(true);
  };

  const handleDelete = async (cueId) => {
    if (!window.confirm('Are you sure you want to delete this cue listing?')) {
      return;
    }

    try {
      await cueService.deleteCue(cueId);
      setMyCues(myCues.filter(c => c.id !== cueId));
      showMessage('success', 'Cue listing deleted successfully');
    } catch (error) {
      showMessage('error', 'Failed to delete cue listing');
    }
  };

  const handleToggleSold = async (cue) => {
    try {
      const updated = await cueService.updateCue(cue.id, {
        ...cue,
        isSold: !cue.isSold
      });
      setMyCues(myCues.map(c => c.id === cue.id ? updated : c));
      showMessage('success', `Cue marked as ${!cue.isSold ? 'sold' : 'available'}`);
    } catch (error) {
      showMessage('error', 'Failed to update cue status');
    }
  };

  const handleSaveCue = async () => {
    setShowCreateModal(false);
    setEditingCue(null);
    await loadMyCues();
    showMessage('success', editingCue ? 'Cue updated successfully' : 'New cue created successfully');
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingCue(null);
  };

  if (loading) {
    return (
      <div className="my-cues-container">
        <div className="loading">Loading your cue listings...</div>
      </div>
    );
  }

  return (
    <div className="my-cues-container">
      <div className="section-header">
        <h2>My Cue Listings</h2>
        <button className="btn primary" onClick={handleCreateNew}>
          + Add New Listing
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {myCues.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any cue listings yet.</p>
          <button className="btn primary" onClick={handleCreateNew}>
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="cues-grid">
          {myCues.map(cue => (
            <CueCard
              key={cue.id}
              cue={cue}
              onEdit={() => handleEdit(cue)}
              onDelete={() => handleDelete(cue.id)}
              onToggleSold={() => handleToggleSold(cue)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CueFormModal
          cue={editingCue}
          onClose={handleCloseModal}
          onSave={handleSaveCue}
        />
      )}
    </div>
  );
}

function CueCard({ cue, onEdit, onDelete, onToggleSold }) {
  const primaryImage = cue.images?.find(img => img.isPrimary) || cue.images?.[0];
  const imageUrl = getImageUrl(primaryImage);

  return (
    <div className={`cue-card ${cue.isSold ? 'sold' : ''}`}>
      <div className="cue-image">
        <img src={imageUrl} alt={cue.title} onError={(e) => e.target.src = '/placeholder.png'} />
        {cue.isSold && <span className="sold-badge">SOLD</span>}
        {cue.images && cue.images.length > 0 && (
          <span className="image-count">📷 {cue.images.length}</span>
        )}
      </div>
      
      <div className="cue-info">
        <h3>{cue.title}</h3>
        <p className="brand">{cue.brand}</p>
        <p className="price">${cue.price?.toFixed(2)}</p>
        <p className="condition">{cue.condition}</p>
        {cue.viewCount !== undefined && (
          <p className="views">👁 {cue.viewCount} views</p>
        )}
        {cue.location && <p className="location">📍 {cue.location}</p>}
      </div>
      
      <div className="cue-actions">
        <button className="btn small" onClick={onEdit}>
          ✏️ Edit
        </button>
        <button 
          className={`btn small ${cue.isSold ? 'success' : 'warning'}`}
          onClick={onToggleSold}
        >
          {cue.isSold ? '✓ Mark Available' : '✓ Mark as Sold'}
        </button>
        <button className="btn small danger" onClick={onDelete}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
