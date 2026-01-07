import React from 'react';
import './CueList.css';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get full image URL from image object
const getImageUrl = (images) => {
  if (!images || images.length === 0) return '';
  const img = images[0];
  // Handle both string URLs and image objects
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function CueList({ cues, onSelect, onAdd, query, viewMode, setViewMode }) {
  // simple client-side filter
  const filtered = (cues || []).filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (c.title || '').toLowerCase().includes(q) || (c.brand || '').toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q);
  });

  return (
    <div className="cue-list">
      {/* Grid or List view based on viewMode */}
      {viewMode === 'grid' ? (
        <div className="cards-grid" data-item-count={filtered.length}>
          {filtered.map((c) => (
            <div key={c.id} className="cue-card" onClick={() => onSelect(c.id)}>
              <div className="card-media" style={{backgroundImage: `url(${getImageUrl(c.images)})`}}>
                {(c.isSold || c.is_sold) ? <span className="sold-badge">SOLD</span> : (c.condition && <span className="cond-badge">{c.condition}</span>)}
              </div>
              <div className="card-body">
                <div className="card-title">{c.title || c.brand}</div>
                <div className="card-sub">{c.brand}</div>
                <div className="card-location">{c.location || '—'}</div>
              </div>
              <div className="card-footer">
                <div className="price">${(c.price||0).toFixed(0)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="list-view">
          {filtered.map((c) => (
            <div key={c.id} className="list-item" onClick={() => onSelect(c.id)}>
              <div className="list-item-image" style={{backgroundImage: `url(${getImageUrl(c.images)})`}}>
                {(c.isSold || c.is_sold) ? <span className="sold-badge">SOLD</span> : (c.condition && <span className="cond-badge">{c.condition}</span>)}
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{c.title || c.brand}</div>
                <div className="list-item-brand">{c.brand}</div>
                <div className="list-item-location">{c.location || '—'}</div>
              </div>
              <div className="list-item-price">${(c.price||0).toFixed(0)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer with availability and view mode toggle */}
      <div className="list-footer">
        <div className="availability">
          <span>{filtered.length} cues available</span>
        </div>
        <div className="view-modes">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            ⊞
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            ☰
          </button>
        </div>
      </div>
    </div>
  );
}
