import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as cueService from '../api/cueService';
import './CueDetail.css';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get full image URL from image object
const getImageUrl = (img) => {
  if (!img) return '';
  // Handle both string URLs and image objects
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};

export default function CueDetail({ onBack }) {
  const { id } = useParams();
  const [cue, setCue] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await cueService.getCueById(id);
      setCue(data);
    }
    load();
  }, [id]);

  if (!cue) return <div className="cue-detail-page"><div className="cue-detail-wrapper">Loading...</div></div>;

  const images = cue.images && cue.images.length > 0 ? cue.images : [];
  const currentImage = getImageUrl(images[imageIndex]);

  const nextImage = () => {
    setImageIndex((i) => (i + 1) % images.length);
  };

  const prevImage = () => {
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const nextImageFullscreen = () => {
    setImageIndex((i) => (i + 1) % images.length);
  };

  const prevImageFullscreen = () => {
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  return (
    <div className="cue-detail-page">
      <div className="cue-detail-wrapper">
        {/* Header */}
        <div className="cue-detail-header">
          <button className="cue-detail-back-btn" onClick={onBack}>
            ← Back to Listings
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="cue-detail-grid">
          {/* Image Section */}
          <div className="cue-detail-images">
            <div className="cue-image-carousel">
              {images.length > 0 ? (
                <>
                  <img 
                    src={currentImage} 
                    alt={`${cue.brand} ${cue.title}`}
                    className="cue-image-main" 
                    onClick={openFullscreen}
                  />
                  {images.length > 1 && (
                    <>
                      <div className="cue-image-controls">
                        <button className="cue-image-btn" onClick={prevImage}>‹</button>
                        <button className="cue-image-btn" onClick={nextImage}>›</button>
                      </div>
                      <div className="cue-image-indicators">
                        {images.map((_, idx) => (
                          <span
                            key={idx}
                            className={`cue-image-dot ${idx === imageIndex ? 'active' : ''}`}
                            onClick={() => setImageIndex(idx)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="cue-image-placeholder">No images available</div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="cue-detail-info">
            {/* Title & Price */}
            <div className="cue-title-section">
              <h1 className="cue-title">
                {cue.brand} {cue.title}
                {(cue.isSold || cue.is_sold) && <span className="badge badge-sold">Sold</span>}
              </h1>
              <div className="cue-price">${(cue.price || 0).toFixed(2)}</div>
            </div>

            {/* Specifications */}
            <div className="cue-specifications">
              <h3 className="cue-spec-title">Specifications</h3>
              <div className="cue-spec-grid">
                <div className="cue-spec-row">
                  <span className="cue-spec-label">Brand</span>
                  <span className="cue-spec-value">{cue.brand || 'Not specified'}</span>
                </div>
                <div className="cue-spec-row">
                  <span className="cue-spec-label">Condition</span>
                  <span className="cue-spec-value">
                    <span className={`badge ${cue.condition === 'New' ? 'badge-success' : 'badge-primary'}`}>
                      {cue.condition || 'Not specified'}
                    </span>
                  </span>
                </div>
                {(cue.material || cue.shaftMaterial) && (
                  <div className="cue-spec-row">
                    <span className="cue-spec-label">Material</span>
                    <span className="cue-spec-value">{cue.material || cue.shaftMaterial}</span>
                  </div>
                )}
                {cue.weight && (
                  <div className="cue-spec-row">
                    <span className="cue-spec-label">Weight</span>
                    <span className="cue-spec-value">{cue.weight}</span>
                  </div>
                )}
                {cue.length && (
                  <div className="cue-spec-row">
                    <span className="cue-spec-label">Length</span>
                    <span className="cue-spec-value">{cue.length}</span>
                  </div>
                )}
                {(cue.tipSize || cue.tip_size) && (
                  <div className="cue-spec-row">
                    <span className="cue-spec-label">Tip Size</span>
                    <span className="cue-spec-value">{cue.tipSize || cue.tip_size}</span>
                  </div>
                )}
                {cue.location && (
                  <div className="cue-spec-row">
                    <span className="cue-spec-label">Location</span>
                    <span className="cue-spec-value">📍 {cue.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {cue.description && (
              <div className="cue-description">
                <h3 className="cue-description-title">Description</h3>
                <p className="cue-description-text">{cue.description}</p>
              </div>
            )}

            {/* Seller Info */}
            <div className="seller-info-card">
              <div className="seller-info-header">
                <div className="seller-avatar">👤</div>
                <h3 className="seller-info-title">Seller Information</h3>
              </div>
              <div className="seller-contact-list">
                <div className="seller-contact-item">
                  <div className="seller-contact-icon">👤</div>
                  <span className="seller-contact-text">
                    {cue.sellerName || cue.seller_name || 'Name not provided'}
                  </span>
                </div>
                {(cue.sellerEmail || cue.seller_email) && (
                  <div className="seller-contact-item">
                    <div className="seller-contact-icon">✉️</div>
                    <span className="seller-contact-text">
                      {cue.sellerEmail || cue.seller_email}
                    </span>
                  </div>
                )}
                {(cue.sellerPhone || cue.seller_phone) && (
                  <div className="seller-contact-item">
                    <div className="seller-contact-icon">📞</div>
                    <span className="seller-contact-text">
                      {cue.sellerPhone || cue.seller_phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {isFullscreen && (
        <div className="fullscreen-viewer" onClick={closeFullscreen}>
          <button className="fullscreen-close" onClick={closeFullscreen}>✕</button>
          <img 
            src={currentImage} 
            alt={`${cue.brand} ${cue.title}`}
            className="fullscreen-image"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <div className="cue-image-controls">
                <button 
                  className="cue-image-btn" 
                  onClick={(e) => { e.stopPropagation(); prevImageFullscreen(); }}
                >
                  ‹
                </button>
                <button 
                  className="cue-image-btn" 
                  onClick={(e) => { e.stopPropagation(); nextImageFullscreen(); }}
                >
                  ›
                </button>
              </div>
              <div className="fullscreen-counter">
                {imageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
